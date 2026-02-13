import { Controller, Post, Req, Headers, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';

@Controller({ path: 'payments', version: '1' })
export class WebhooksController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const webhookSecret = this.config.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    const isValid = this.stripeService.verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    await this.paymentsService.handleWebhookEvent(event);

    return { received: true };
  }
}
