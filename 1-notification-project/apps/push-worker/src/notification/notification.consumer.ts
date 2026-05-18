import type { AsyncMessage } from 'rabbitmq-client';
import { z } from 'zod/v4';
import { PushNotificationService } from './notification.service.js';
import { FatalNotificationError } from '../shared/errors/app.error.js';
import { logger } from '../shared/logger/logger.js';

const NotificationMessageSchema = z.object({
  messageId: z.string(),
  correlationId: z.string(),
  channel: z.literal('push'),
  payload: z.object({
    deviceToken: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
  }),
  createdAt: z.string(),
  metadata: z.object({
    sourceService: z.string(),
    retryCount: z.number(),
  }),
});

export class PushNotificationConsumer {
  constructor(private readonly service: PushNotificationService) {}

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
