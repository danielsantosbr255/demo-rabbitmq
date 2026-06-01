import { env } from "../../config/env.js"
import { getConnection } from "../../infra/messaging/rabbitmq.client.js"
import { RabbitMQConsumer } from "../../infra/messaging/rabbitmq.consumer.js"
import { SmsNotificationHandler } from "./sms.handler.js"
import { StubSmsRepository } from "./sms.repository.js"
import type { TSmsMessage } from "./sms.schema.js"
import { SmsNotificationService } from "./sms.service.js"

export async function createSmsNotificationConsumer() {
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

  return consumer
}
