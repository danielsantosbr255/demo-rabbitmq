import { z } from "zod"

// ----- Data Models -----

export const QueueSchema = z
  .object({
    name: z.string().describe("The name of the RabbitMQ queue. Example: q.notifications.email"),
    messages: z
      .number()
      .int()
      .describe("Total number of messages currently in the queue, including unacknowledged ones."),
    messagesUnacked: z.number().int().describe("Number of messages delivered to consumers but not yet acknowledged."),
    ttl: z.number().int().nullable().describe("Message time-to-live in milliseconds, if configured. Example: 86400000"),
    headTimestamp: z
      .number()
      .nullable()
      .describe("Unix timestamp (ms) of the oldest message in the queue. Example: 1716400000000"),
  })
  .describe("RabbitMQ queue")

export const GetQueuesResponseSchema = z
  .object({
    serverTime: z
      .number()
      .int()
      .describe("Unix timestamp (ms) of when this response was generated. Example: 1716400012345"),
    queues: z.array(QueueSchema).describe("List of all queues visible to the Monitor API."),
  })
  .describe("OK")

export const DlqMessagePayloadSchema = z
  .object({
    channel: z.string().optional().describe("The notification channel. Example: email"),
    to: z.string().optional().describe("Destination address (email or phone). Example: user@example.com"),
    subject: z.string().optional().describe("Subject line (email only). Example: Welcome to our service"),
    body: z.string().optional().describe("Body content of the notification."),
  })
  .describe("Original notification payload from the failed message.")

export const DlqMessageSchema = z
  .object({
    payload: z
      .union([z.string(), DlqMessagePayloadSchema])
      .describe("The body of the dead-lettered message. Can be a raw string or a parsed notification object."),
    properties: z
      .object({
        delivery_mode: z.number().int().optional().describe("RabbitMQ delivery mode. 2 = persistent. Example: 2"),
        headers: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("AMQP headers attached to the message, including dead-letter metadata."),
      })
      .optional()
      .describe("AMQP properties of the message."),
    redelivered: z.boolean().describe("Whether this message has been redelivered at least once."),
    routing_key: z
      .string()
      .describe("The routing key used when the message was originally published. Example: q.notifications.dlq"),
  })
  .describe("A single message peeked from the Dead Letter Queue.")

export const DeleteDlqResponseSchema = z
  .object({
    ok: z.boolean().describe("Returns true if the DLQ was successfully purged."),
  })
  .describe("OK")

// ----- Route Schemas -----

export const GetQueuesRouteSchema = {
  tags: ["Queues"],
  summary: "List All Queues",
  description:
    "Returns real-time statistics for all RabbitMQ queues visible to the management API, including message counts and TTL settings.",
  response: {
    200: GetQueuesResponseSchema,
  },
}

export const StreamQueuesRouteSchema = {
  tags: ["Queues"],
  summary: "Stream Queue Stats (SSE)",
  description:
    "Opens a Server-Sent Events (SSE) stream that pushes queue statistics every 500ms. Connect via `EventSource` in the browser. The response body is a continuous `text/event-stream` and is not a standard JSON response.",
  response: {},
}

export const GetDlqRouteSchema = {
  tags: ["Dead Letter Queue"],
  summary: "Peek DLQ Messages",
  description:
    "Peeks up to 20 messages from the Dead Letter Queue (`q.notifications.dlq`) without removing them. Messages are requeued after inspection.",
  response: {
    200: z.array(DlqMessageSchema).describe("OK"),
  },
}

export const DeleteDlqRouteSchema = {
  tags: ["Dead Letter Queue"],
  summary: "Purge DLQ",
  description:
    "Permanently deletes **all messages** from the Dead Letter Queue (`q.notifications.dlq`). This action is irreversible.",
  response: {
    200: DeleteDlqResponseSchema,
  },
}

export const HealthRouteSchema = {
  tags: ["System"],
  summary: "Monitor API Health Check",
  description: "Returns the current health status and timestamp of the Monitor API service.",
  response: {
    200: z
      .object({
        status: z.string().describe("The current health status. Example: ok"),
        service: z.string().describe("The name of the service. Example: monitor-api"),
        timestamp: z.string().describe("ISO-8601 timestamp of the health check."),
      })
      .describe("OK"),
  },
}

// ----- Types -----

export type Queue = z.infer<typeof QueueSchema>
export type GetQueuesResponse = z.infer<typeof GetQueuesResponseSchema>
export type DlqMessage = z.infer<typeof DlqMessageSchema>
