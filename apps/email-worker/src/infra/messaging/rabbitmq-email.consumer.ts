import type { AsyncMessage, Connection, Consumer } from "rabbitmq-client"
import { ConsumerStatus } from "rabbitmq-client"
import { emailMessageSchema } from "../../modules/email/email.schema.js"
import type { EmailNotificationService } from "../../modules/email/email.service.js"
import { AppError } from "../../shared/errors/app.error.js"
import { env } from "../config/env.js"
import { logger } from "../logger/logger.js"
import { RabbitMQRetryPublisher } from "./rabbitmq-retry.publisher.js"
import { CHANNEL, DLQ, DLX, EXCHANGE, QUEUE, RETRY_DLX, setupRabbitMQTopology } from "./rabbitmq-topology.js"

export class RabbitMQEmailConsumer {
  private consumer: Consumer | null = null
  private readonly retryPublisher: RabbitMQRetryPublisher

  constructor(
    private readonly connection: Connection,
    private readonly service: EmailNotificationService,
  ) {
    this.retryPublisher = new RabbitMQRetryPublisher(connection)
  }

  async start(): Promise<void> {
    await setupRabbitMQTopology(this.connection)

    this.consumer = this.connection.createConsumer(
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
    await this.retryPublisher.close()
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
        return ConsumerStatus.DROP
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

      await this.retryPublisher.publishRetry(msg, retryCount, childLogger)
    }
  }
}
