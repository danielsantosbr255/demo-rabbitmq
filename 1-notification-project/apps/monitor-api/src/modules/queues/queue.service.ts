import { rabbitFetch } from '../../shared/messaging/rabbitmq.client.js';

interface RabbitQueue {
  name: string;
  messages: number;
  messages_unacknowledged?: number;
  head_message_timestamp?: number;
  arguments?: Record<string, unknown>;
  [key: string]: unknown;
}

export class QueueService {
  async getQueues() {
    const res = await rabbitFetch('/queues');
    if (!res.ok) throw new Error(`RabbitMQ API: ${res.statusText}`);

    const raw = await res.json() as RabbitQueue[];

    const queues = raw.map(q => ({
      name: q.name,
      messages: q.messages,
      messagesUnacked: q.messages_unacknowledged ?? 0,
      ttl: (q.arguments?.["x-message-ttl"] as number) ?? null,
      headTimestamp: q.head_message_timestamp ?? null,
    }));

    return { serverTime: Date.now(), queues };
  }

  async getDlq() {
    const res = await rabbitFetch('/queues/%2F/q.notifications.dlq/get', {
      method: 'POST',
      body: JSON.stringify({
        count: 20,
        ackmode: 'ack_requeue_true',
        encoding: 'auto',
        truncate: 50000,
      }),
    });
    if (!res.ok) throw new Error(`RabbitMQ API: ${res.statusText}`);
    return res.json();
  }

  async deleteDlq() {
    const res = await rabbitFetch('/queues/%2F/q.notifications.dlq/contents', {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`RabbitMQ API: ${res.statusText}`);
    return { ok: true };
  }
}
