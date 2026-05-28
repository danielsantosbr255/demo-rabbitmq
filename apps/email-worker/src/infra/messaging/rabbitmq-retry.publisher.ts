import type { Logger } from "pino"
import type { AsyncMessage, Connection, Publisher } from "rabbitmq-client"

export class RabbitMQRetryPublisher {
  private publisher: Publisher | null = null

  constructor(private readonly connection: Connection) {}

  async publishRetry(msg: AsyncMessage, queue: string, retryCount: number, logger: Logger): Promise<void> {
    if (!this.publisher) {
      this.publisher = this.connection.createPublisher({ confirm: true })
    }

    const retryQueue = `${queue}.retry.${retryCount}`

    await this.publisher.send(
      {
        routingKey: retryQueue,
        durable: true,
        headers: { ...msg.headers, "x-retry-count": retryCount + 1 },
        ...(msg.messageId && { messageId: msg.messageId }),
        ...(msg.correlationId && { correlationId: msg.correlationId }),
        contentType: "application/json",
        timestamp: Math.floor(Date.now() / 1000),
      },
      msg.body,
    )

    logger.warn({ retryQueue, nextRetry: retryCount + 1 }, "Message scheduled for retry")
  }

  async close(): Promise<void> {
    if (this.publisher) {
      await this.publisher.close()
      this.publisher = null
    }
  }
}
