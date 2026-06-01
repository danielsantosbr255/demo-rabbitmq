import type { FastifyReply, FastifyRequest } from "fastify"

export class AppController {
  health = async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      service: "monitor-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    })
  }
}
