import { getConnection, closeConnection } from './shared/messaging/rabbitmq.client.js';
import { startConsumer } from './shared/messaging/rabbitmq.consumer.js';
import { PushNotificationConsumer } from './notification/notification.consumer.js';
import { PushNotificationService } from './notification/notification.service.js';
import { StubPushRepository } from './notification/notification.repository.js';
import { logger } from './shared/logger/logger.js';
import { env } from './shared/config/env.js';

async function main(): Promise<void> {
  const connection = getConnection();

  const repository = new StubPushRepository();
  const service = new PushNotificationService(repository);
  const consumerHandler = new PushNotificationConsumer(service);

  const consumer = startConsumer(connection, {
    queue: 'q.push',
    prefetch: env.PREFETCH_COUNT,
    maxRetries: env.MAX_RETRIES,
    handler: (msg) => consumerHandler.handle(msg),
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    await consumer.close();
    await closeConnection();
    process.exit(0);
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });

  logger.info('Push worker started');
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start push worker');
  process.exit(1);
});
