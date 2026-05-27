import type { Connection } from "rabbitmq-client"
import { env } from "../config/env.js"

export const EXCHANGE = "notifications.exchange"
export const DLX = "notifications.dlx"
export const RETRY_DLX = "notifications.retry.dlx"
export const CHANNEL = "email"
export const QUEUE = `q.${CHANNEL}`
export const DLQ = "q.notifications.dlq"

export async function setupRabbitMQTopology(connection: Connection): Promise<void> {
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
}
