import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {}

  async send(options: EmailOptions): Promise<void> {
    const smtpHost = this.config.get('SMTP_HOST');

    if (!smtpHost) {
      this.logger.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
      this.logger.debug(`[EMAIL BODY] ${options.text || '(HTML email)'}`);
      return;
    }

    // In production, integrate with nodemailer or an email API (SendGrid, SES, etc.)
    this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
  }

  private webUrl(): string {
    return this.config.get('WEB_URL', 'https://hushroom.com');
  }

  async sendWelcome(to: string, name: string): Promise<void> {
    await this.send({
      to,
      subject: 'Welcome to Hushroom',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1e293b;">Welcome to Hushroom, ${name}!</h1>
          <p style="color: #475569; line-height: 1.6;">
            You've taken the first step toward structured human presence.
          </p>
          <ol style="color: #475569; line-height: 2;">
            <li>Complete your profile</li>
            <li>Define your first goal</li>
            <li>Find a companion and book a session</li>
          </ol>
          <a href="${this.webUrl()}/dashboard"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; margin-top: 24px;">
            Go to Dashboard
          </a>
        </div>
      `,
      text: `Welcome to Hushroom, ${name}! Visit ${this.webUrl()}/dashboard to get started.`,
    });
  }

  async sendSessionBooked(to: string, details: { goalTitle: string; companionName: string; scheduledAt: string }): Promise<void> {
    await this.send({
      to,
      subject: `Session Booked: ${details.goalTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1e293b;">Session Confirmed</h1>
          <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0 0 8px; color: #475569;"><strong>Goal:</strong> ${details.goalTitle}</p>
            <p style="margin: 0 0 8px; color: #475569;"><strong>Companion:</strong> ${details.companionName}</p>
            <p style="margin: 0; color: #475569;"><strong>Scheduled:</strong> ${details.scheduledAt}</p>
          </div>
          <a href="${this.webUrl()}/sessions"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
            View Session
          </a>
        </div>
      `,
    });
  }

  async sendSessionCompleted(to: string, details: { goalTitle: string; sessionId: string }): Promise<void> {
    await this.send({
      to,
      subject: `Session Complete: ${details.goalTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1e293b;">Session Complete!</h1>
          <p style="color: #475569;">
            Your session for "${details.goalTitle}" has been completed.
            Please take a moment to rate your experience.
          </p>
          <a href="${this.webUrl()}/session/${details.sessionId}/evaluate"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
            Rate This Session
          </a>
        </div>
      `,
    });
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const resetUrl = `${this.webUrl()}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Reset Your Hushroom Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1e293b;">Password Reset</h1>
          <p style="color: #475569;">
            Click the button below to set a new password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
            Reset Password
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `Reset your password: ${resetUrl}`,
    });
  }
}
