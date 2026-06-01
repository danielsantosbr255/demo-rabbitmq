import { AppModule } from "./app.module.js"
import { env } from "./config/env.js"
import { logger } from "./infra/logger/logger.js"

async function bootstrap(): Promise<void> {
  const app = await AppModule()

  await app.listen({ port: env.PORT, host: env.HOST })
  logger.info({ port: env.PORT, host: env.HOST }, "DLQ Inspector API started")

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received")
    await app.close()
    process.exit(0)
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"))
  process.on("SIGINT", () => void shutdown("SIGINT"))
}

bootstrap().catch((err) => {
  logger.fatal({ err }, "Failed to start DLQ Inspector API")
  process.exit(1)
})
