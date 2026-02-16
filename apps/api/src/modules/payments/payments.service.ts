import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { StripeService } from './stripe.service';
import { AuthorizePaymentDto } from './dto/authorize-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { validateTransition } from '../sessions/session-state.machine';

const COMMISSION_RATES: Record<string, number> = {
  STANDARD: 0.3,
  VERIFIED: 0.25,
  EXPERT: 0.2,
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly stripe: StripeService,
  ) {}

  async authorizePayment(userId: string, dto: AuthorizePaymentDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
      include: { companion: true, payment: true },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId)
      throw new ForbiddenException('Session does not belong to this user');
    if (session.payment)
      throw new BadRequestException('Payment already exists for this session');

    validateTransition(session.status, 'PAYMENT_AUTHORIZED');

    if (!session.companion)
      throw new BadRequestException('Session has no companion assigned');

    const companion = session.companion;
    const hourlyRate =
      Number(companion.baseRate) + Number(companion.expertPremium ?? 0);
    const amount = Math.round(hourlyRate * (session.plannedDuration / 60) * 100) / 100;
    const commissionRate = COMMISSION_RATES[companion.type] ?? 0.3;
    const platformFee = Math.round(amount * commissionRate * 100) / 100;
    const companionPayout = Math.round((amount - platformFee) * 100) / 100;
    const amountCents = Math.round(amount * 100);

    const paymentIntent = await this.stripe.createPaymentIntent({
      amount: amountCents,
      currency: 'eur',
      capture_method: 'manual',
      metadata: {
        sessionId: dto.sessionId,
        userId,
        companionId: companion.id,
      },
    });

    const payment = await this.prisma.payment.create({
      data: {
        sessionId: dto.sessionId,
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        companionPayout,
        platformFee,
        commissionRate,
        currency: 'EUR',
        status: 'AUTHORIZED',
        authorizedAt: new Date(),
      },
    });

    await this.prisma.session.update({
      where: { id: dto.sessionId },
      data: { status: 'PAYMENT_AUTHORIZED' },
    });

    return {
      ...payment,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async capturePayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'AUTHORIZED')
      throw new BadRequestException('Payment is not in AUTHORIZED status');

    if (payment.stripePaymentIntentId) {
      await this.stripe.capturePaymentIntent(payment.stripePaymentIntentId);
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'CAPTURED',
        capturedAt: new Date(),
      },
    });
  }

  async cancelPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'AUTHORIZED')
      throw new BadRequestException('Only authorized payments can be cancelled');

    if (payment.stripePaymentIntentId) {
      await this.stripe.cancelPaymentIntent(payment.stripePaymentIntentId);
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CANCELLED' },
    });
  }

  async refundPayment(paymentId: string, dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'CAPTURED')
      throw new BadRequestException('Only captured payments can be refunded');

    const refundAmount = dto.amount ?? Number(payment.amount);
    const isPartial = refundAmount < Number(payment.amount);

    if (payment.stripePaymentIntentId) {
      await this.stripe.createRefund({
        payment_intent: payment.stripePaymentIntentId,
        amount: Math.round(refundAmount * 100),
        reason: dto.reason?.toLowerCase(),
      });
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: refundAmount,
        refundReason: (dto.reason as any) ?? null,
      },
    });
  }

  async getPaymentsByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: {
        session: {
          include: {
            goal: { select: { title: true } },
            companion: {
              include: { user: { select: { displayName: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentById(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        session: {
          include: {
            goal: true,
            companion: {
              include: { user: { select: { displayName: true, avatarUrl: true } } },
            },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async getCompanionEarnings(companionId: string) {
    const captured = await this.prisma.payment.findMany({
      where: { session: { companionId }, status: 'CAPTURED' },
    });

    const pending = await this.prisma.payment.findMany({
      where: { session: { companionId }, status: 'AUTHORIZED' },
    });

    const totalEarnings = captured.reduce(
      (sum, p) => sum + Number(p.companionPayout),
      0,
    );
    const pendingAmount = pending.reduce(
      (sum, p) => sum + Number(p.companionPayout),
      0,
    );

    const recentPayments = await this.prisma.payment.findMany({
      where: {
        session: { companionId },
        status: { in: ['CAPTURED', 'AUTHORIZED'] },
      },
      include: {
        session: {
          include: {
            goal: { select: { title: true } },
            user: { select: { displayName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      pendingPayouts: Math.round(pendingAmount * 100) / 100,
      completedPayouts: captured.length,
      recentPayments,
    };
  }

  async onboardCompanion(userId: string) {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!companion) throw new NotFoundException('Companion profile not found');

    let accountId: string = companion.stripeConnectAccountId ?? '';

    if (!accountId) {
      const account = await this.stripe.createConnectAccount({
        type: 'express',
        email: companion.user.email,
      });
      accountId = account.id;

      await this.prisma.companionProfile.update({
        where: { id: companion.id },
        data: { stripeConnectAccountId: accountId },
      });
    }

    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
    const accountLink = await this.stripe.createAccountLink(
      accountId,
      `${webUrl}/companion/stripe-setup?refresh=true`,
      `${webUrl}/companion/stripe-setup?success=true`,
    );

    return { url: accountLink.url };
  }

  async handleWebhookEvent(event: { id: string; type: string; data: { object: any } }) {
    // Idempotency: skip if this event was already processed
    const idempotencyKey = `webhook:event:${event.id}`;
    const alreadyProcessed = await this.redis.set(idempotencyKey, '1', 'EX', 86400, 'NX');
    if (alreadyProcessed === null) {
      this.logger.log(`Skipping duplicate webhook event ${event.id}`);
      return;
    }

    const obj = event.data.object;

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const payment = await this.prisma.payment.findUnique({
          where: { stripePaymentIntentId: obj.id },
        });
        if (payment && payment.status === 'AUTHORIZED') {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'CAPTURED', capturedAt: new Date() },
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const payment = await this.prisma.payment.findUnique({
          where: { stripePaymentIntentId: obj.id },
        });
        if (payment && payment.status !== 'FAILED') {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
          });
        }
        break;
      }

      case 'payment_intent.canceled': {
        const payment = await this.prisma.payment.findUnique({
          where: { stripePaymentIntentId: obj.id },
        });
        if (payment && payment.status !== 'CANCELLED') {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'CANCELLED' },
          });
        }
        break;
      }

      case 'charge.refunded': {
        const paymentIntentId = obj.payment_intent;
        if (!paymentIntentId) break;
        const payment = await this.prisma.payment.findUnique({
          where: { stripePaymentIntentId: paymentIntentId },
        });
        if (payment && payment.status === 'CAPTURED') {
          const refundedTotal = (obj.amount_refunded ?? 0) / 100;
          const isFullRefund = refundedTotal >= Number(payment.amount);
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
              refundedAt: new Date(),
              refundAmount: refundedTotal,
            },
          });
        }
        break;
      }

      case 'charge.dispute.created': {
        const paymentIntentId = obj.payment_intent;
        if (!paymentIntentId) break;
        const payment = await this.prisma.payment.findUnique({
          where: { stripePaymentIntentId: paymentIntentId },
          include: { session: true },
        });
        if (payment) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'DISPUTED' },
          });
          // Log for admin review
          await this.prisma.auditLog.create({
            data: {
              userId: payment.userId,
              action: 'PAYMENT_DISPUTED',
              entityType: 'Payment',
              entityId: payment.id,
              metadata: {
                disputeId: obj.id,
                reason: obj.reason,
                amount: obj.amount,
              },
            },
          });
          this.logger.warn(`Payment ${payment.id} disputed — dispute ID: ${obj.id}, reason: ${obj.reason}`);
        }
        break;
      }

      case 'account.updated': {
        const accountId = obj.id;
        const companion = await this.prisma.companionProfile.findFirst({
          where: { stripeConnectAccountId: accountId },
        });
        if (companion) {
          const payoutsEnabled = obj.payouts_enabled ?? false;
          const chargesEnabled = obj.charges_enabled ?? false;
          await this.prisma.companionProfile.update({
            where: { id: companion.id },
            data: {
              payoutsEnabled,
              chargesEnabled,
            },
          });
          this.logger.log(`Stripe Connect account ${accountId} updated: payouts=${payoutsEnabled}, charges=${chargesEnabled}`);
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled webhook event type: ${event.type}`);
    }
  }
}
