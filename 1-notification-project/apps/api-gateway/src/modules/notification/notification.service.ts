import { randomUUID } from 'node:crypto';
import type { INotificationPublisher, CreateNotificationDto, EnqueueResult } from './notification.types.js';
import { logger } from '../../shared/logger/logger.js';

export class NotificationService {
  constructor(private readonly publisher: INotificationPublisher) { }

  async enqueue(dto: CreateNotificationDto): Promise<EnqueueResult> {
    const messageId = randomUUID();

    const message = {
      messageId,
      correlationId: randomUUID(),
      channel: dto.channel,
      payload: dto.payload,
      createdAt: new Date().toISOString(),
      metadata: {
        sourceService: 'api-gateway',
        retryCount: 0,
      },
    };

    await this.publisher.publish(message);

    logger.info({ messageId, channel: dto.channel }, 'Notification enqueued');

    return { messageId, status: 'queued', channel: dto.channel };
  }
}
