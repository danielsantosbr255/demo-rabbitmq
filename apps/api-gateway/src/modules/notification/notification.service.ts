import { randomUUID } from "node:crypto"
import { logger } from "../../infra/logger/logger.js"
import type { CreateNotificationDto, EnqueueResult, INotificationPublisher } from "./notification.types.js"

export class NotificationService {
  constructor(private readonly publisher: INotificationPublisher) {}

  async enqueue(dto: CreateNotificationDto): Promise<EnqueueResult> {
    const messageId = randomUUID()

    const message = {
      messageId,
      correlationId: randomUUID(),
      channel: dto.channel,
      payload: dto.payload,
      createdAt: new Date().toISOString(),
      metadata: {
        sourceService: "api-gateway",
        retryCount: 0,
      },
    }

    await this.publisher.publish(message)

    logger.info({ messageId, channel: dto.channel }, "Notification enqueued")

    return { messageId, status: "queued", channel: dto.channel }
  }
}
