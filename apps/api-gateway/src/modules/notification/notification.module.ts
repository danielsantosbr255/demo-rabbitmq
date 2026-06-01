import type { ZodTypeProvider } from "@fastify/type-provider-zod"
import type { FastifyInstance } from "fastify"
import { RabbitMQNotificationPublisher } from "./adapters/notification.publisher.js"
import { NotificationController } from "./notification.controller.js"
import { CreateNotificationRouteSchema } from "./notification.schema.js"
import { NotificationService } from "./notification.service.js"

export const notificationModule = async (app: FastifyInstance) => {
  const publisher = new RabbitMQNotificationPublisher()
  const service = new NotificationService(publisher)
  const controller = new NotificationController(service)

  const appWithZod = app.withTypeProvider<ZodTypeProvider>()

  appWithZod.post("/notifications", { schema: CreateNotificationRouteSchema }, controller.enqueue)
}
