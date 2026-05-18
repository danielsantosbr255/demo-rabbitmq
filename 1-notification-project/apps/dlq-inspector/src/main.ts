import { getConnection, closeConnection } from './shared/messaging/rabbitmq.client.js';
import { logger } from './shared/logger/logger.js';

async function main(): Promise<void> {
  const connection = getConnection();

  const consumer = connection.createConsumer(
    {
      queue: 'q.notifications.dlq',
      qos: { prefetchCount: 1 },
    },
    async (msg) => {
      const raw = msg.body as Record<string, unknown>;
      const headers = msg.headers ?? {};

      logger.error(
        {
          messageId: msg.messageId,
          channel: raw?.channel,
          totalAttempts: headers['x-retry-count'],
          originalPayload: raw,
          diedAt: new Date().toISOString(),
        },
        'Dead letter message received — manual intervention required',
      );

      // Message is auto-ACKed by returning void from handler
    },
  );

  consumer.on('error', (err) => {
    logger.error({ err }, 'DLQ consumer error');
  });

  consumer.on('ready', () => {
    logger.info('DLQ Inspector consumer ready');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    await consumer.close();
    await closeConnection();
    process.exit(0);
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });

  logger.info('DLQ Inspector started');
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start DLQ Inspector');
  process.exit(1);
});
