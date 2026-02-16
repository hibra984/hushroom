import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const smtpHost = this.config.get('SMTP_HOST');
    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: this.config.get<number>('SMTP_PORT', 587) === 465,
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
      this.logger.log(`Email transport configured via ${smtpHost}`);
    } else {
      this.logger.warn('SMTP_HOST not configured — emails will be logged to console only');
    }
  }

  async send(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
      this.logger.debug(`[EMAIL BODY] ${options.text || '(HTML email)'}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get('EMAIL_FROM', 'noreply@hushroom.com'),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error}`);
    }
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

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${this.webUrl()}/verify-email?token=${token}`;
    await this.send({
      to,
      subject: 'Verify Your Hushroom Email',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1e293b;">Verify Your Email</h1>
          <p style="color: #475569;">
            Click the button below to verify your email address. This link expires in 24 hours.
          </p>
          <a href="${verifyUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
            Verify Email
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `Verify your email: ${verifyUrl}`,
    });
  }

  async sendCompanionApproved(to: string, name: string): Promise<void> {
    await this.send({
      to,
      subject: 'Your Hushroom Companion Application is Approved!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1e293b;">Congratulations, ${name}!</h1>
          <p style="color: #475569; line-height: 1.6;">
            Your companion application has been approved. You can now start accepting sessions.
          </p>
          <ol style="color: #475569; line-height: 2;">
            <li>Set up your availability schedule</li>
            <li>Complete your Stripe payout setup</li>
            <li>Go online to start receiving sessions</li>
          </ol>
          <a href="${this.webUrl()}/companion/dashboard"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; margin-top: 24px;">
            Go to Companion Dashboard
          </a>
        </div>
      `,
      text: `Your companion application has been approved! Visit ${this.webUrl()}/companion/dashboard to get started.`,
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
