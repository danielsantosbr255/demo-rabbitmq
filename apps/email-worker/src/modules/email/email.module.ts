import { env } from "../../config/env.js"
import { getConnection } from "../../infra/messaging/rabbitmq.client.js"
import { RabbitMQConsumer } from "../../infra/messaging/rabbitmq.consumer.js"
import { EmailNotificationHandler } from "./email.handler.js"
import type { TEmailMessage } from "./email.schema.js"
import { EmailNotificationService } from "./email.service.js"
import { NodemailerEmailRepository } from "./repositories/nodemailer.repository.js"

export async function createEmailNotificationConsumer() {
  const connection = getConnection()

  const repository = new NodemailerEmailRepository()
  const service = new EmailNotificationService(repository)
  const handler = new EmailNotificationHandler(service)

  const consumer = new RabbitMQConsumer<TEmailMessage>(connection, {
    channel: "email",
    prefetch: env.PREFETCH_COUNT,
    maxRetries: env.MAX_RETRIES,
    retryDelays: [10_000, 30_000, 120_000],
    handler: handler.handle.bind(handler),
  })

  return consumer
}
