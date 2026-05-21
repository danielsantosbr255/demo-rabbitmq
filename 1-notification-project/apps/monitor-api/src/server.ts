import fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import { env } from './shared/config/env.js';
import { logger } from './shared/logger/logger.js';

// Parse RabbitMQ Management API credentials once at startup
const rabbitUrl = new URL(env.RABBITMQ_API_URL);
const RABBIT_BASE = `${rabbitUrl.protocol}//${rabbitUrl.host}/api`;
const RABBIT_AUTH = rabbitUrl.username && rabbitUrl.password
  ? 'Basic ' + Buffer.from(`${rabbitUrl.username}:${rabbitUrl.password}`).toString('base64')
  : undefined;

function rabbitFetch(path: string, init?: RequestInit) {
  const headers: Record<string, string> = {};
  if (RABBIT_AUTH) headers['Authorization'] = RABBIT_AUTH;
  if (init?.body) headers['Content-Type'] = 'application/json';
  return fetch(`${RABBIT_BASE}${path}`, { ...init, headers: { ...headers, ...init?.headers } });
}

interface RabbitQueue {
  name: string;
  messages: number;
  messages_unacknowledged?: number;
  head_message_timestamp?: number;
  arguments?: Record<string, unknown>;
  [key: string]: unknown;
}

export async function buildServer() {
  const app = fastify({ logger: false });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    logger.error({ err: error }, 'Unhandled error');
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message,
    });
  });

  app.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      service: 'monitor-api',
      timestamp: new Date().toISOString()
    });
  });

  // GET /queues — enriched queue list with TTL and head timestamp
  app.get('/queues', async (_request, reply) => {
    const res = await rabbitFetch('/queues');
    if (!res.ok) throw new Error(`RabbitMQ API: ${res.statusText}`);

    const raw = await res.json() as RabbitQueue[];

    const queues = raw.map(q => ({
      name: q.name,
      messages: q.messages,
      messagesUnacked: q.messages_unacknowledged ?? 0,
      ttl: (q.arguments?.['x-message-ttl'] as number) ?? null,
      headTimestamp: q.head_message_timestamp ?? null,
    }));

    return reply.send({
      serverTime: Date.now(),
      queues
    });
  });

  // GET /dlq — peek at dead-lettered messages without consuming
  app.get('/dlq', async (_request, reply) => {
    const res = await rabbitFetch('/queues/%2F/q.notifications.dlq/get', {
      method: 'POST',
      body: JSON.stringify({ count: 20, ackmode: 'ack_requeue_true', encoding: 'auto', truncate: 50000 }),
    });
    if (!res.ok) throw new Error(`RabbitMQ API: ${res.statusText}`);

    const data = await res.json();
    return reply.send(data);
  });

  // DELETE /dlq — purge all messages from the DLQ
  app.delete('/dlq', async (_request, reply) => {
    const res = await rabbitFetch('/queues/%2F/q.notifications.dlq/contents', {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`RabbitMQ API: ${res.statusText}`);

    return reply.send({ ok: true });
  });

  return app;
}

export { env };
