import type { AsyncMessage } from 'rabbitmq-client';
import { EmailNotificationService } from './notification.service.js';
import { FatalNotificationError } from '../shared/errors/app.error.js';
import { logger } from '../shared/logger/logger.js';
import { notificationMessageSchema } from './notification.schema.js';

export class EmailNotificationConsumer {
  constructor(private readonly service: EmailNotificationService) { }

  async handle(msg: AsyncMessage): Promise<void> {
    const raw = msg.body;
    const parsed = notificationMessageSchema.safeParse(raw);

    if (!parsed.success) {
      logger.error(
        { issues: parsed.error.issues, messageId: (raw as Record<string, unknown>)?.messageId },
        'Invalid message schema — sending to DLQ immediately',
      );
      throw new FatalNotificationError('Invalid message schema');
    }

    const { messageId, payload } = parsed.data;
    await this.service.process(messageId, payload);
  }
}
