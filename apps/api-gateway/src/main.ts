import { AppModule } from "./app.module.js"
import { env } from "./config/env.js"
import { logger } from "./infra/logger/logger.js"
import { closeConnection } from "./infra/messaging/rabbitmq.client.js"

async function main(): Promise<void> {
  const app = await AppModule()

  await app.listen({ port: env.PORT, host: env.HOST })
  logger.info({ port: env.PORT, host: env.HOST }, "API Gateway started")

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received")
    await app.close()
    await closeConnection()
    process.exit(0)
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"))
  process.on("SIGINT", () => void shutdown("SIGINT"))
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start API Gateway")
  process.exit(1)
})
