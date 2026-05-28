import type { AsyncMessage, Connection, Consumer } from "rabbitmq-client"
import { ConsumerStatus } from "rabbitmq-client"
import { AppError } from "../../shared/errors/app.error.js"
import { logger } from "../../shared/logger/logger.js"
import { RabbitMQRetryPublisher } from "./rabbitmq-retry.publisher.js"
import type { ConsumerOptions } from "./types.js"

const EXCHANGE = "notifications.exchange"
const DLX = "notifications.dlx"
const RETRY_DLX = "notifications.retry.dlx"
const DLQ = "q.notifications.dlq"

export class RabbitMQConsumer<T = object> {
  private consumer: Consumer | null = null
  private readonly retryPublisher: RabbitMQRetryPublisher

  constructor(
    private readonly connection: Connection,
    private readonly options: ConsumerOptions<T>,
  ) {
    this.retryPublisher = new RabbitMQRetryPublisher(connection)
  }

  async start(): Promise<void> {
    const { channel, prefetch } = this.options
    const queue = `q.${channel}`

    await this.setupRabbitMQTopology()

    this.consumer = this.connection.createConsumer(
      {
        queue,
        qos: { prefetchCount: prefetch },
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
          { exchange: EXCHANGE, queue, routingKey: channel },
          { exchange: RETRY_DLX, queue, routingKey: channel },
          { exchange: DLX, queue: DLQ },
        ],
      },
      this.handleMessage.bind(this),
    )
  }

  async stop(): Promise<void> {
    if (this.consumer) {
      await this.consumer.close()
      this.consumer = null
    }
    await this.retryPublisher.close()
  }

  private async handleMessage(msg: AsyncMessage): Promise<number | undefined> {
    const { channel, maxRetries, handler } = this.options

    const queue = `q.${channel}`
    const messageId = msg.messageId ?? "unknown"
    const retryCount = Number(msg.headers?.["x-retry-count"] ?? 0)
    const childLogger = logger.child({ messageId, queue, retryCount })

    childLogger.info("Message received")

    try {
      await handler(msg.body)
      childLogger.info("Message processed successfully")
    } catch (err) {
      childLogger.error({ err }, "Message processing failed")

      const isFatal = err instanceof AppError && err.isFatal

      if (isFatal || retryCount >= maxRetries) {
        childLogger.error({ totalAttempts: retryCount + 1, isFatal }, "Message sent to DLQ (no more retries)")
        return ConsumerStatus.DROP
      }

      await this.retryPublisher.publishRetry(msg, queue, retryCount, childLogger)
    }
  }

  private async setupRabbitMQTopology(): Promise<void> {
    const { channel, maxRetries, retryDelays } = this.options
    const queue = `q.${channel}`

    for (let i = 0; i < maxRetries; i++) {
      const retryQueue = `${queue}.retry.${i}`
      const delay = retryDelays[i] ?? 10_000
      await this.connection.queueDeclare({
        queue: retryQueue,
        durable: true,
        arguments: {
          "x-dead-letter-exchange": "notifications.retry.dlx",
          "x-dead-letter-routing-key": channel,
          "x-message-ttl": delay,
        },
      })
    }

    await this.connection.queueDeclare({ queue: DLQ, durable: true })
  }
}
