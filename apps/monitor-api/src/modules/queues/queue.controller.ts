import type { FastifyReply, FastifyRequest } from "fastify"
import { logger } from "../../infra/logger/logger.js"
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
      try {
        const data = await this.queueService.getQueues()
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
      } catch (err) {
        logger.warn({ err }, "Failed to fetch queue data for SSE stream")
        reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: "Failed to fetch queue data" })}\n\n`)
      }
    }

    await sendUpdate()

    const interval = setInterval(() => {
      void sendUpdate()
    }, 500)

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
