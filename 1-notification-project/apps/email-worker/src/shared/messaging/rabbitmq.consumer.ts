import type { Connection, Consumer, AsyncMessage } from 'rabbitmq-client';
import { ConsumerStatus } from 'rabbitmq-client';
import { AppError } from '../errors/app.error.js';
import { logger } from '../logger/logger.js';

interface ConsumerOptions {
  queue: string;
  prefetch: number;
  maxRetries: number;
  handler: (msg: AsyncMessage) => Promise<void>;
}

export function startConsumer(connection: Connection, options: ConsumerOptions): Consumer {
  const { queue, prefetch, maxRetries, handler } = options;

  const consumer = connection.createConsumer(
    {
      queue,
      qos: { prefetchCount: prefetch },
      queueOptions: { passive: true },
    },
    async (msg) => {
      const messageId = msg.messageId ?? 'unknown';
      const retryCount = Number(msg.headers?.['x-retry-count'] ?? 0);
      const childLogger = logger.child({ messageId, queue, retryCount });

      childLogger.info('Message received');

      try {
        await handler(msg);
        childLogger.info('Message processed successfully');
      } catch (err) {
        childLogger.error({ err }, 'Message processing failed');

        const isFatal = err instanceof AppError && err.isFatal;

        if (isFatal || retryCount >= maxRetries) {
          childLogger.error({ totalAttempts: retryCount + 1, isFatal }, 'Message sent to DLQ (no more retries)');
          return ConsumerStatus.DROP;
        }

        const retryQueue = `${queue}.retry.${retryCount}`;
        const pub = connection.createPublisher({ confirm: true });

        try {
          await pub.send(
            {
              routingKey: retryQueue,
              headers: { ...msg.headers, 'x-retry-count': retryCount + 1 },
              ...(msg.messageId && { messageId: msg.messageId }),
              ...(msg.correlationId && { correlationId: msg.correlationId }),
              contentType: 'application/json',
              timestamp: Math.floor(Date.now() / 1000),
            },
            msg.body,
          );

          childLogger.warn({ retryQueue, nextRetry: retryCount }, 'Message scheduled for retry');
        } finally {
          await pub.close();
        }
      }
    },
  );

  consumer.on('error', (err) => {
    logger.error({ err, queue }, 'Consumer error');
  });

  consumer.on('ready', () => {
    logger.info({ queue, prefetch }, 'Consumer ready');
  });

  return consumer;
}
