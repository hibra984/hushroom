import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { EmailService } from '../../common/email/email.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { validateTransition } from './session-state.machine';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly emailService: EmailService,
  ) {}

  async create(userId: string, dto: CreateSessionDto) {
    const session = await this.prisma.session.create({
      data: {
        userId,
        type: dto.type,
        status: 'PENDING_MATCH',
        plannedDuration: dto.plannedDuration ?? 30,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SESSION_CREATE',
        entityType: 'Session',
        entityId: session.id,
      },
    });

    return session;
  }

  async findById(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        goal: true,
        contract: true,
        companion: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${id} not found`);
    }

    return session;
  }

  async findByUser(userId: string, status?: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        goal: true,
        contract: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCompanion(companionId: string, status?: string) {
    return this.prisma.session.findMany({
      where: {
        companionId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        goal: true,
        contract: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async transitionStatus(
    sessionId: string,
    userId: string,
    newStatus: string,
    extra?: { cancellationReason?: string },
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { companion: true },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Verify the user is the session owner or the companion
    const isOwner = session.userId === userId;
    const isCompanion = session.companion?.userId === userId;

    if (!isOwner && !isCompanion) {
      throw new ForbiddenException('You are not a participant of this session');
    }

    validateTransition(session.status, newStatus);

    const updateData: Record<string, any> = {
      status: newStatus,
    };

    if (newStatus === 'IN_PROGRESS' && !session.startedAt) {
      updateData.startedAt = new Date();
    }

    if (newStatus === 'COMPLETED' || newStatus === 'ABANDONED') {
      updateData.endedAt = new Date();
      if (session.startedAt) {
        updateData.durationMinutes = Math.round(
          (Date.now() - session.startedAt.getTime()) / 60_000,
        );
      }
    }

    if (newStatus === 'CANCELLED' && extra?.cancellationReason) {
      updateData.cancellationReason = extra.cancellationReason;
    }

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        goal: true,
        payment: true,
        companion: { include: { user: { select: { email: true } } } },
        user: { select: { email: true } },
      },
    });

    // Auto-capture payment on session completion
    if (newStatus === 'COMPLETED' && updated.payment && updated.payment.status === 'AUTHORIZED') {
      try {
        await this.paymentsService.capturePayment(updated.payment.id);
        this.logger.log(`Auto-captured payment ${updated.payment.id} for session ${sessionId}`);
      } catch (err) {
        this.logger.error(`Failed to auto-capture payment ${updated.payment.id}: ${err}`);
      }
    }

    // Auto-cancel payment on session cancellation
    if (newStatus === 'CANCELLED' && updated.payment && updated.payment.status === 'AUTHORIZED') {
      try {
        await this.paymentsService.cancelPayment(updated.payment.id);
        this.logger.log(`Auto-cancelled payment ${updated.payment.id} for session ${sessionId}`);
      } catch (err) {
        this.logger.error(`Failed to auto-cancel payment ${updated.payment.id}: ${err}`);
      }
    }

    // Email notifications on session completion
    if (newStatus === 'COMPLETED') {
      const goalTitle = updated.goal?.title ?? 'Session';
      if (updated.user?.email) {
        this.emailService.sendSessionCompleted(updated.user.email, { goalTitle, sessionId }).catch(() => {});
      }
      if (updated.companion?.user?.email) {
        this.emailService.sendSessionCompleted(updated.companion.user.email, { goalTitle, sessionId }).catch(() => {});
      }
    }

    return updated;
  }

  /**
   * Cron job: every 5 minutes, auto-abandon stale sessions.
   * - IN_PROGRESS or PAUSED for > 4 hours → ABANDONED
   * - PENDING_MATCH or MATCHED created > 24 hours ago → CANCELLED
   */
  @Cron('*/5 * * * *')
  async abandonStaleSessions() {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Abandon sessions in progress > 4 hours
    const staleActive = await this.prisma.session.findMany({
      where: {
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
        startedAt: { lt: fourHoursAgo },
      },
      include: { payment: true },
    });

    for (const session of staleActive) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          status: 'ABANDONED',
          endedAt: new Date(),
          durationMinutes: session.startedAt
            ? Math.round((Date.now() - session.startedAt.getTime()) / 60_000)
            : null,
        },
      });
      this.logger.warn(`Auto-abandoned stale session ${session.id} (was ${session.status})`);
    }

    // Cancel sessions stuck in matching > 24 hours
    const staleMatching = await this.prisma.session.findMany({
      where: {
        status: { in: ['PENDING_MATCH', 'MATCHED'] },
        createdAt: { lt: twentyFourHoursAgo },
      },
      include: { payment: true },
    });

    for (const session of staleMatching) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'Auto-cancelled: no activity for 24 hours',
        },
      });

      // Auto-cancel any authorized payment
      if (session.payment && session.payment.status === 'AUTHORIZED') {
        try {
          await this.paymentsService.cancelPayment(session.payment.id);
        } catch (err) {
          this.logger.error(`Failed to cancel payment for stale session ${session.id}: ${err}`);
        }
      }

      this.logger.warn(`Auto-cancelled stale session ${session.id} (was ${session.status})`);
    }

    const totalCleaned = staleActive.length + staleMatching.length;
    if (totalCleaned > 0) {
      this.logger.log(`Cleaned up ${totalCleaned} stale sessions`);
    }
  }
}
