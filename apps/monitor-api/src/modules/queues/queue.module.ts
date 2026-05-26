import type { ZodTypeProvider } from "@fastify/type-provider-zod"
import type { FastifyInstance } from "fastify"
import { QueueController } from "./queue.controller.js"
import {
  DeleteDlqRouteSchema,
  GetDlqRouteSchema,
  GetQueuesRouteSchema,
  StreamQueuesRouteSchema,
} from "./queue.schema.js"
import { QueueService } from "./queue.service.js"

async function QueueModule(fastify: FastifyInstance) {
  const queueService = new QueueService()
  const queueController = new QueueController(queueService)

  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get("/", { schema: GetQueuesRouteSchema }, queueController.getQueues)
  app.get("/stream", { schema: StreamQueuesRouteSchema }, queueController.streamQueues)
  app.get("/dlq", { schema: GetDlqRouteSchema }, queueController.getDlq)
  app.delete("/dlq", { schema: DeleteDlqRouteSchema }, queueController.deleteDlq)
}

export { QueueModule }
