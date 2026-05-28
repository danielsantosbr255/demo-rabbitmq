import { env } from "./infra/config/env.js"
import { logger } from "./infra/logger/logger.js"
import { closeConnection, getConnection } from "./infra/messaging/rabbitmq.client.js"
import { RabbitMQConsumer } from "./infra/messaging/rabbitmq.consumer.js"
import { EmailNotificationHandler } from "./modules/email/email.handler.js"
import { createEmailNotificationService } from "./modules/email/email.module.js"
import type { TEmailMessage } from "./modules/email/email.schema.js"

async function main(): Promise<void> {
  const connection = getConnection()

  const service = createEmailNotificationService()
  const handler = new EmailNotificationHandler(service)

  const consumer = new RabbitMQConsumer<TEmailMessage>(connection, {
    channel: "email",
    prefetch: env.PREFETCH_COUNT,
    maxRetries: env.MAX_RETRIES,
    retryDelays: [10_000, 30_000, 120_000],
    handler: handler.handle.bind(handler),
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

  logger.info("Email worker started")
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start email worker")
  process.exit(1)
})
