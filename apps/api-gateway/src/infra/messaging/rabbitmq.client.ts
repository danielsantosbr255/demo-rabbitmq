import { Connection } from "rabbitmq-client"
import { env } from "../../shared/config/env.js"
import { logger } from "../../shared/logger/logger.js"

let connection: Connection | null = null

export function getConnection(): Connection {
  if (connection) return connection

  connection = new Connection(env.RABBITMQ_URL)

  connection.on("error", (err) => {
    logger.error({ err }, "RabbitMQ connection error")
  })

  connection.on("connection", () => {
    logger.info("RabbitMQ connected")
  })

  return connection
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.close()
    connection = null
    logger.info("RabbitMQ connection closed")
  }
}
