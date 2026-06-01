import { logger } from "./infra/logger/logger.js"
import { closeConnection } from "./infra/messaging/rabbitmq.client.js"
import { createSmsNotificationConsumer } from "./modules/sms/sms.module.js"

async function bootstrap(): Promise<void> {
  const consumer = await createSmsNotificationConsumer()
  await consumer.start()

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received")
    await consumer.stop()
    await closeConnection()
    process.exit(0)
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"))
  process.on("SIGINT", () => void shutdown("SIGINT"))

  logger.info("SMS worker started")
}

bootstrap().catch((err) => {
  logger.fatal({ err }, "Failed to start SMS worker")
  process.exit(1)
})
