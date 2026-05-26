import type { Connection, Consumer, AsyncMessage } from 'rabbitmq-client';
import { ConsumerStatus } from 'rabbitmq-client';
import { AppError } from '../errors/app.error.js';
import { logger } from '../logger/logger.js';

interface ConsumerOptions {
  channel: string;
  prefetch: number;
  maxRetries: number;
  retryDelays: number[];
  handler: (msg: AsyncMessage) => Promise<void>;
}

export async function startConsumer(connection: Connection, options: ConsumerOptions): Promise<Consumer> {
  const { channel, prefetch, maxRetries, retryDelays, handler } = options;
  const queue = `q.${channel}`;

  for (let i = 0; i < maxRetries; i++) {
    const retryQueue = `${queue}.retry.${i}`;
    const delay = retryDelays[i] ?? 10_000;
    await connection.queueDeclare({
      queue: retryQueue,
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'notifications.retry.dlx',
        'x-dead-letter-routing-key': channel,
        'x-message-ttl': delay,
      },
    });
  }

  await connection.queueDeclare({
    queue: 'q.notifications.dlq',
    durable: true,
  });

  const consumer = connection.createConsumer(
    {
      queue,
      qos: { prefetchCount: prefetch },
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'notifications.dlx',
          'x-max-length': 50_000,
        },
      },
      exchanges: [
        { exchange: 'notifications.exchange', type: 'direct', durable: true },
        { exchange: 'notifications.dlx', type: 'fanout', durable: true },
        { exchange: 'notifications.retry.dlx', type: 'direct', durable: true },
      ],
      queueBindings: [
        { exchange: 'notifications.exchange', queue, routingKey: channel },
        { exchange: 'notifications.retry.dlx', queue, routingKey: channel },
        { exchange: 'notifications.dlx', queue: 'q.notifications.dlq' },
      ],
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
              durable: true,
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
