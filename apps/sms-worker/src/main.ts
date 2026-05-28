import { closeConnection, getConnection } from "./infra/messaging/rabbitmq.client.js"
import { RabbitMQConsumer } from "./infra/messaging/rabbitmq.consumer.js"
import { SmsNotificationHandler } from "./modules/sms/sms.handler.js"
import { StubSmsRepository } from "./modules/sms/sms.repository.js"
import type { TSmsMessage } from "./modules/sms/sms.schema.js"
import { SmsNotificationService } from "./modules/sms/sms.service.js"
import { env } from "./shared/config/env.js"
import { logger } from "./shared/logger/logger.js"

async function main(): Promise<void> {
  const connection = getConnection()

  const repository = new StubSmsRepository()
  const smsService = new SmsNotificationService(repository)
  const smsHandler = new SmsNotificationHandler(smsService)

  const consumer = new RabbitMQConsumer<TSmsMessage>(connection, {
    channel: "sms",
    prefetch: env.PREFETCH_COUNT,
    maxRetries: env.MAX_RETRIES,
    retryDelays: [10_000, 30_000, 120_000],
    handler: smsHandler.handle.bind(smsHandler),
  })

  await consumer.start()

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received")
    await consumer.stop()
    await closeConnection()
    process.exit(0)
  }

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM")
  })
  process.on("SIGINT", () => {
    void shutdown("SIGINT")
  })

  logger.info("SMS worker started")
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start SMS worker")
  process.exit(1)
})
