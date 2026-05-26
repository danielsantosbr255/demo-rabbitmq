import type { FastifyReply, FastifyRequest } from "fastify"
import type { CreateNotificationDto } from "./notification.schema.js"
import type { NotificationService } from "./notification.service.js"

export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  enqueue = async (request: FastifyRequest<{ Body: CreateNotificationDto }>, reply: FastifyReply) => {
    const result = await this.service.enqueue(request.body)
    return reply.status(202).send(result)
  }

  health = async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      status: "ok",
      service: "api-gateway",
      timestamp: new Date().toISOString(),
    })
  }
}
