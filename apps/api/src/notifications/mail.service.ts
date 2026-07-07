import { Injectable, Logger } from '@nestjs/common';

/**
 * Resend email wrapper (REST API, no SDK dependency). No-ops with a debug
 * log when RESEND_API_KEY is not configured, so every environment works
 * without email credentials. Fire-and-forget: email failures never break
 * the originating flow.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey = process.env.RESEND_API_KEY;
  private readonly from = process.env.MAIL_FROM ?? 'Tennisillo <noreply@tennisillo.app>';

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.debug(`Email skipped (no RESEND_API_KEY): "${subject}" → ${to}`);
      return;
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: this.from, to: [to], subject, html }),
      });
      if (!res.ok) {
        this.logger.warn(`Resend responded ${res.status} for "${subject}" → ${to}`);
      }
    } catch (err) {
      this.logger.warn(`Email send failed: ${(err as Error).message}`);
    }
  }
}
