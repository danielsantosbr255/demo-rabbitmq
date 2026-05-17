import { buildServer, env } from './server.js';
import { getConnection, closeConnection } from './shared/messaging/rabbitmq.client.js';
import { RabbitMQNotificationPublisher } from './notification/notification.publisher.js';
import { logger } from './shared/logger/logger.js';

async function main(): Promise<void> {
  const connection = getConnection();
  const publisher = new RabbitMQNotificationPublisher(connection);

  const app = buildServer(publisher);

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    await app.close();
    await publisher.close();
    await closeConnection();
    process.exit(0);
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });

  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info({ port: env.PORT, host: env.HOST }, 'API Gateway started');
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start API Gateway');
  process.exit(1);
});
