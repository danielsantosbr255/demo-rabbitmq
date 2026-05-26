import type { FastifyReply, FastifyRequest } from "fastify"
import type { QueueService } from "./queue.service.js"

export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  getQueues = async (_request: FastifyRequest, reply: FastifyReply) => {
    const queues = await this.queueService.getQueues()
    reply.send(queues)
  }

  streamQueues = async (request: FastifyRequest, reply: FastifyReply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    })

    const sendUpdate = async () => {
      const data = await this.queueService.getQueues()
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    await sendUpdate()

    const interval = setInterval(sendUpdate, 500)

    request.raw.on("close", () => {
      clearInterval(interval)
    })
  }

  getDlq = async (_request: FastifyRequest, reply: FastifyReply) => {
    const dlq = await this.queueService.getDlq()
    reply.send(dlq)
  }

  deleteDlq = async (_request: FastifyRequest, reply: FastifyReply) => {
    const dlq = await this.queueService.deleteDlq()
    reply.send(dlq)
  }
}
