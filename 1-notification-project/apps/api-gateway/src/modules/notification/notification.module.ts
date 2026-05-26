import type { FastifyInstance } from "fastify";
import { NotificationController } from "./notification.controller.js";
import { NotificationService } from "./notification.service.js";
import type { ZodTypeProvider } from "@fastify/type-provider-zod";
import { RabbitMQNotificationPublisher } from "./adapters/notification.publisher.js";
import { CreateNotificationRouteSchema, HealthRouteSchema } from "./notification.schema.js";

export const notificationModule = async (app: FastifyInstance) => {
  const publisher = new RabbitMQNotificationPublisher();
  const service = new NotificationService(publisher);
  const controller = new NotificationController(service);

  const appWithZod = app.withTypeProvider<ZodTypeProvider>();

  appWithZod.post('/notifications', { schema: CreateNotificationRouteSchema }, controller.enqueue);
  appWithZod.get('/health', { schema: HealthRouteSchema }, controller.health);
};
