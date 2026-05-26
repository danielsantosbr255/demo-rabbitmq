import { buildServer } from "./server.js"
import { env } from "./shared/config/env.js"
import { logger } from "./shared/logger/logger.js"

async function main(): Promise<void> {
  const app = await buildServer()

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received")
    await app.close()
    process.exit(0)
  }

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM")
  })
  process.on("SIGINT", () => {
    void shutdown("SIGINT")
  })

  await app.listen({ port: env.PORT, host: env.HOST })
  logger.info({ port: env.PORT, host: env.HOST }, "DLQ Inspector API started")
}

main().catch((err) => {
  logger.fatal({ err }, "Failed to start DLQ Inspector API")
  process.exit(1)
})
