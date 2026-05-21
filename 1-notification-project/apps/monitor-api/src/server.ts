import fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import { env } from './shared/config/env.js';
import { logger } from './shared/logger/logger.js';
import { QueueModule } from './modules/queues/queue.module.js';

export async function buildServer() {
  const app = fastify({ loggerInstance: logger });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  await app.register(QueueModule, { prefix: '/queues' });

  app.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      service: 'monitor-api',
      timestamp: new Date().toISOString()
    });
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    logger.error({ err: error }, 'Unhandled error');
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message,
    });
  });

  return app;
}

export { env };
