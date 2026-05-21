import type { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import { CreateNotificationSchema, EnqueueResultSchema } from './notification.schema.js';
import { NotificationService } from './notification.service.js';
import type { INotificationPublisher } from './notification.types.js';

export async function notificationRoutes(app: FastifyInstance, publisher: INotificationPublisher): Promise<void> {
  const service = new NotificationService(publisher);

  const postOptions = {
    schema: {
      body: CreateNotificationSchema,
      response: { 202: EnqueueResultSchema },
    },
  };

  app.post('/notifications', postOptions, async (request, reply) => {
    const result = await service.enqueue(request.body as z.infer<typeof CreateNotificationSchema>);
    return reply.status(202).send(result);
  });

  app.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString()
    });
  });
}
