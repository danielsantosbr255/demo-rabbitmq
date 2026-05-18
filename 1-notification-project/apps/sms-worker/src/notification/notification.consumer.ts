import type { AsyncMessage } from 'rabbitmq-client';
import { z } from 'zod/v4';
import { SmsNotificationService } from './notification.service.js';
import { FatalNotificationError } from '../shared/errors/app.error.js';
import { logger } from '../shared/logger/logger.js';

const NotificationMessageSchema = z.object({
  messageId: z.string(),
  correlationId: z.string(),
  channel: z.literal('sms'),
  payload: z.object({
    to: z.string(),
    body: z.string().min(1),
  }),
  createdAt: z.string(),
  metadata: z.object({
    sourceService: z.string(),
    retryCount: z.number(),
  }),
});

export class SmsNotificationConsumer {
  constructor(private readonly service: SmsNotificationService) {}

  async handle(msg: AsyncMessage): Promise<void> {
    const raw = msg.body;
    const parsed = NotificationMessageSchema.safeParse(raw);

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
