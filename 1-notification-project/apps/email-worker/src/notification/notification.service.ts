import type { IEmailRepository, EmailPayload } from './notification.types.js';
import { FatalNotificationError } from '../shared/errors/app.error.js';
import { logger } from '../shared/logger/logger.js';

export class EmailNotificationService {
  constructor(private readonly emailRepo: IEmailRepository) {}

  async process(messageId: string, payload: EmailPayload): Promise<void> {
    logger.info({ messageId, to: payload.to }, 'Processing email notification');

    this.validatePayload(payload);

    await this.emailRepo.send({
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
    });

    logger.info({ messageId, to: payload.to }, 'Email sent successfully');
  }

  private validatePayload(payload: EmailPayload): void {
    if (!payload.to || !payload.subject) {
      throw new FatalNotificationError('Invalid payload: missing required fields');
    }
  }
}
