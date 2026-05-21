import type { FastifyInstance } from "fastify";
import { QueueController } from "./queue.controller.js";
import { QueueService } from "./queue.service.js";

async function QueueModule(fastify: FastifyInstance) {
  const queueService = new QueueService();
  const queueController = new QueueController(queueService);

  fastify.get('/', queueController.getQueues);
  fastify.get('/stream', queueController.streamQueues);
  fastify.get('/dlq', queueController.getDlq);
  fastify.delete('/dlq', queueController.deleteDlq);
}

export { QueueModule };