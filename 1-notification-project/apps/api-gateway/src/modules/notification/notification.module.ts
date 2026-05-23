import { NotificationController } from "./notification.controller.js";
import { NotificationService } from "./notification.service.js";
import { CreateNotificationRouteSchema, HealthRouteSchema } from "./notification.schema.js";
import type { FastifyInstance } from "fastify";
import type { INotificationPublisher } from "./notification.types.js";
import type { ZodTypeProvider } from "@fastify/type-provider-zod";

export const notificationModule = async (app: FastifyInstance, publisher: INotificationPublisher) => {
  const service = new NotificationService(publisher);
  const controller = new NotificationController(service);

  const appWithZod = app.withTypeProvider<ZodTypeProvider>();

  appWithZod.post('/notifications', { schema: CreateNotificationRouteSchema }, controller.enqueue);
  appWithZod.get('/health', { schema: HealthRouteSchema }, controller.health);
};
