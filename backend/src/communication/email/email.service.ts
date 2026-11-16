import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { EMAIL_ENV } from './email.constants';

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    const host = this.configService.get<string>(EMAIL_ENV.SMTP_HOST);
    const from = this.configService.get<string>(EMAIL_ENV.SMTP_FROM);
    return Boolean(host?.trim() && from?.trim());
  }

  async sendMail(input: SendMailInput): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn(
        'SMTP is not configured; email was not sent (set SMTP_HOST and SMTP_FROM)',
      );
      throw new ApplicationException(
        ErrorCode.AUTH_RESET_EMAIL_NOT_CONFIGURED,
        'Email delivery is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const transporter = this.getTransporter();
    const from = this.configService.get<string>(EMAIL_ENV.SMTP_FROM)!;

    try {
      await transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html ?? input.text,
      });
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw new ApplicationException(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Failed to send email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>(EMAIL_ENV.SMTP_HOST)!;
    const port = Number(
      this.configService.get<string>(EMAIL_ENV.SMTP_PORT) ?? '587',
    );
    const secure =
      this.configService.get<string>(EMAIL_ENV.SMTP_SECURE) === 'true';
    const user = this.configService.get<string>(EMAIL_ENV.SMTP_USER);
    const pass = this.configService.get<string>(EMAIL_ENV.SMTP_PASS);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: pass ?? '' } : undefined,
    });

    return this.transporter;
  }
}
