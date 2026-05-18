import { getConnection, closeConnection } from './shared/messaging/rabbitmq.client.js';
import { startConsumer } from './shared/messaging/rabbitmq.consumer.js';
import { EmailNotificationConsumer } from './notification/notification.consumer.js';
import { EmailNotificationService } from './notification/notification.service.js';
import { NodemailerEmailRepository } from './notification/notification.repository.js';
import { logger } from './shared/logger/logger.js';
import { env } from './shared/config/env.js';

async function main(): Promise<void> {
  const connection = getConnection();

  const repository = new NodemailerEmailRepository();
  const service = new EmailNotificationService(repository);
  const consumerHandler = new EmailNotificationConsumer(service);

  const consumer = startConsumer(connection, {
    queue: 'q.email',
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

  logger.info('Email worker started');
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start email worker');
  process.exit(1);
});
