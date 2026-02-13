import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class StripeService {
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl = 'https://api.stripe.com/v1';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
  }

  private flattenParams(
    obj: Record<string, any>,
    prefix?: string,
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}[${key}]` : key;
      if (value === undefined || value === null) continue;
      if (typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flattenParams(value, fullKey));
      } else {
        result[fullKey] = String(value);
      }
    }
    return result;
  }

  private async request(
    method: string,
    path: string,
    body?: Record<string, any>,
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const options: RequestInit = { method, headers };
    if (body) {
      options.body = new URLSearchParams(
        this.flattenParams(body),
      ).toString();
    }
    const res = await fetch(url, options);
    const data: any = await res.json();
    if (!res.ok) {
      throw new BadRequestException(
        data.error?.message || 'Stripe API error',
      );
    }
    return data;
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
    capture_method?: string;
  }) {
    return this.request('POST', '/payment_intents', params);
  }

  async capturePaymentIntent(id: string) {
    return this.request('POST', `/payment_intents/${id}/capture`);
  }

  async cancelPaymentIntent(id: string) {
    return this.request('POST', `/payment_intents/${id}/cancel`);
  }

  async createRefund(params: {
    payment_intent: string;
    amount?: number;
    reason?: string;
  }) {
    return this.request('POST', '/refunds', params);
  }

  async createConnectAccount(params: {
    type: string;
    email: string;
    country?: string;
  }) {
    return this.request('POST', '/accounts', params);
  }

  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
  ) {
    return this.request('POST', '/account_links', {
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  }

  verifyWebhookSignature(
    payload: string,
    signatureHeader: string,
    secret: string,
  ): boolean {
    try {
      const parts = signatureHeader.split(',');
      let timestamp = '';
      let signature = '';

      for (const part of parts) {
        const [key, value] = part.trim().split('=');
        if (key === 't') timestamp = value;
        if (key === 'v1') signature = value;
      }

      if (!timestamp || !signature) return false;

      const signedPayload = `${timestamp}.${payload}`;
      const expectedSig = createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

      return timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig),
      );
    } catch {
      return false;
    }
  }
}
