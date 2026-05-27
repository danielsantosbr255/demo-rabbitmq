import { logger } from "./infra/logger/logger.js"
import { closeConnection, getConnection } from "./infra/messaging/rabbitmq.client.js"
import { RabbitMQEmailConsumer } from "./infra/messaging/rabbitmq-email.consumer.js"
import { createEmailNotificationService } from "./modules/email/email.module.js"

async function main(): Promise<void> {
  const connection = getConnection()
  const service = createEmailNotificationService()
  const consumer = new RabbitMQEmailConsumer(connection, service)

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
