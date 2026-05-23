import fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from '@fastify/type-provider-zod';
import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import { logger } from './shared/logger/logger.js';
import { QueueModule } from './modules/queues/queue.module.js';
import { errorHandlerMiddleware } from './shared/middlewares/error-handler.middleware.js';
import { HealthRouteSchema } from './modules/queues/queue.schema.js';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';

export async function buildServer() {
  const app = fastify({ loggerInstance: logger });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Monitor API',
        description: 'Internal API for monitoring RabbitMQ queues and Dead Letter Queue (DLQ) messages.',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(fastifyApiReference, {
    routePrefix: '/docs',
    configuration: {
      theme: 'purple',
      layout: 'modern',
      darkMode: false
    },
  });

  await app.register(QueueModule, { prefix: '/queues' });

  app.withTypeProvider<ZodTypeProvider>().get('/health', {
    schema: HealthRouteSchema,
  }, async (_request, reply) => {
    return reply.send({
      status: 'ok',
      service: 'monitor-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.setErrorHandler(errorHandlerMiddleware);

  return app;
}
