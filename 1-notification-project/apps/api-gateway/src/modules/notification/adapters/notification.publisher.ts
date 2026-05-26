import type { Connection, Publisher } from 'rabbitmq-client';
import type { INotificationPublisher, NotificationMessage } from '../notification.types.js';
import { logger } from '../../../shared/logger/logger.js';
import { getConnection } from '../../../shared/messaging/rabbitmq.client.js';

const EXCHANGE = 'notifications.exchange';

export class RabbitMQNotificationPublisher implements INotificationPublisher {
  private publisher: Publisher;
  private connection: Connection;

  constructor() {
    this.connection = getConnection();
    this.publisher = this.connection.createPublisher({
      confirm: true,
      maxAttempts: 3,
      exchanges: [{ exchange: EXCHANGE, type: 'direct', durable: true },],
    });

    this.publisher.on('retry', (err, envelope) => {
      logger.warn({ err, envelope }, 'Publisher retrying');
    });
  }

  async publish(message: NotificationMessage): Promise<void> {
    await this.publisher.send(
      {
        exchange: EXCHANGE,
        routingKey: message.channel,
        durable: true,
        headers: {
          'x-retry-count': 0,
          'x-source-service': 'api-gateway',
        },
        messageId: message.messageId,
        correlationId: message.correlationId,
        contentType: 'application/json',
        timestamp: Math.floor(Date.now() / 1000),
      },
      message,
    );

    logger.debug(
      { messageId: message.messageId, exchange: EXCHANGE, routingKey: message.channel },
      'Message published to broker',
    );
  }

  async close(): Promise<void> {
    await this.publisher.close();
  }
}
