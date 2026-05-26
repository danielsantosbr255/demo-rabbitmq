import type { AsyncMessage, Consumer } from "rabbitmq-client"
import { ConsumerStatus } from "rabbitmq-client"
import { env } from "../../../infra/config/env.js"
import { logger } from "../../../infra/logger/logger.js"
import { getConnection } from "../../../infra/messaging/rabbitmq.client.js"
import { AppError, FatalNotificationError } from "../../../shared/errors/app.error.js"
import { emailMessageSchema } from "../email.schema.js"
import type { EmailNotificationService } from "../email.service.js"

const EXCHANGE = "notifications.exchange"
const DLX = "notifications.dlx"
const RETRY_DLX = "notifications.retry.dlx"
const CHANNEL = "email"
const QUEUE = `q.${CHANNEL}`
const DLQ = `q.notifications.dlq`

export class RabbitMQEmailConsumer {
  private consumer: Consumer | null = null

  constructor(private readonly service: EmailNotificationService) {}

  async start(): Promise<void> {
    const connection = getConnection()
    const maxRetries = env.MAX_RETRIES
    const retryDelays = [10_000, 30_000, 120_000] // 10s, 30s, 2m

    for (let i = 0; i < maxRetries; i++) {
      const retryQueue = `${QUEUE}.retry.${i}`
      const delay = retryDelays[i] ?? 10_000
      await connection.queueDeclare({
        queue: retryQueue,
        durable: true,
        arguments: {
          "x-dead-letter-exchange": RETRY_DLX,
          "x-dead-letter-routing-key": CHANNEL,
          "x-message-ttl": delay,
        },
      })
    }

    await connection.queueDeclare({ queue: DLQ, durable: true })

    this.consumer = connection.createConsumer(
      {
        queue: QUEUE,
        qos: { prefetchCount: env.PREFETCH_COUNT },
        queueOptions: {
          durable: true,
          arguments: {
            "x-dead-letter-exchange": DLX,
            "x-max-length": 50_000,
          },
        },
        exchanges: [
          { exchange: EXCHANGE, type: "direct", durable: true },
          { exchange: DLX, type: "fanout", durable: true },
          { exchange: RETRY_DLX, type: "direct", durable: true },
        ],
        queueBindings: [
          { exchange: EXCHANGE, queue: QUEUE, routingKey: CHANNEL },
          { exchange: RETRY_DLX, queue: QUEUE, routingKey: CHANNEL },
          { exchange: DLX, queue: DLQ },
        ],
      },
      this.handleMessage.bind(this),
    )

    this.consumer.on("error", (err) => {
      logger.error({ err, queue: QUEUE }, "Consumer error")
    })

    this.consumer.on("ready", () => {
      logger.info({ queue: QUEUE, prefetch: env.PREFETCH_COUNT }, "Consumer ready")
    })
  }

  async stop(): Promise<void> {
    if (this.consumer) {
      await this.consumer.close()
      this.consumer = null
    }
  }

  private async handleMessage(msg: AsyncMessage): Promise<number | undefined> {
    const messageId = msg.messageId ?? "unknown"
    const retryCount = Number(msg.headers?.["x-retry-count"] ?? 0)
    const childLogger = logger.child({ messageId, queue: QUEUE, retryCount })

    childLogger.info("Message received")

    try {
      const raw = msg.body
      const parsed = emailMessageSchema.safeParse(raw)

      if (!parsed.success) {
        childLogger.error({ issues: parsed.error.issues }, "Invalid message schema — sending to DLQ immediately")
        throw new FatalNotificationError("Invalid message schema")
      }

      const { payload } = parsed.data

      await this.service.process(parsed.data.messageId, payload)

      childLogger.info("Message processed successfully")
    } catch (err) {
      childLogger.error({ err }, "Message processing failed")

      const isFatal = err instanceof AppError && err.isFatal

      if (isFatal || retryCount >= env.MAX_RETRIES) {
        childLogger.error({ totalAttempts: retryCount + 1, isFatal }, "Message sent to DLQ (no more retries)")
        return ConsumerStatus.DROP
      }

      const retryQueue = `${QUEUE}.retry.${retryCount}`
      const pub = getConnection().createPublisher({ confirm: true })

      try {
        await pub.send(
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

        childLogger.warn({ retryQueue, nextRetry: retryCount }, "Message scheduled for retry")
      } finally {
        await pub.close()
      }
    }
  }
}
