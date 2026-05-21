import fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler } from '@fastify/type-provider-zod';
import { env } from './shared/config/env.js';
import { logger } from './shared/logger/logger.js';
import { notificationRoutes } from './notification/notification.controller.js';
import type { INotificationPublisher } from './notification/notification.types.js';

export async function buildServer(publisher: INotificationPublisher) {
  const app = fastify({ logger: false });

  await app.register(cors, { origin: true });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        details: error.validation,
      });
    }

    logger.error({ err: error }, 'Unhandled error');

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message,
    });
  });

  app.register(notificationRoutes, publisher);

  return app;
}

export { env };
