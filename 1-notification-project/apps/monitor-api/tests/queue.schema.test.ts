import { describe, expect, it } from "vitest"
import {
  DeleteDlqResponseSchema,
  DlqMessageSchema,
  GetQueuesResponseSchema,
  QueueSchema,
} from "../src/modules/queues/queue.schema.js"

describe("QueueSchema", () => {
  it("should validate a queue with all fields", () => {
    const result = QueueSchema.safeParse({
      name: "q.notifications.email",
      messages: 5,
      messagesUnacked: 1,
      ttl: 86400000,
      headTimestamp: 1716400000000,
    })
    expect(result.success).toBe(true)
  })

  it("should validate a queue with null optional fields", () => {
    const result = QueueSchema.safeParse({
      name: "q.notifications.sms",
      messages: 0,
      messagesUnacked: 0,
      ttl: null,
      headTimestamp: null,
    })
    expect(result.success).toBe(true)
  })

  it("should reject a queue missing required fields", () => {
    const result = QueueSchema.safeParse({
      messages: 0,
      messagesUnacked: 0,
      ttl: null,
      headTimestamp: null,
    })
    expect(result.success).toBe(false)
  })

  it("should reject non-integer message counts", () => {
    const result = QueueSchema.safeParse({
      name: "q.test",
      messages: 1.5,
      messagesUnacked: 0,
      ttl: null,
      headTimestamp: null,
    })
    expect(result.success).toBe(false)
  })
})

describe("GetQueuesResponseSchema", () => {
  it("should validate a valid response with queue list", () => {
    const result = GetQueuesResponseSchema.safeParse({
      serverTime: 1716400012345,
      queues: [{ name: "q.notifications.email", messages: 3, messagesUnacked: 0, ttl: null, headTimestamp: null }],
    })
    expect(result.success).toBe(true)
  })

  it("should validate a response with an empty queue list", () => {
    const result = GetQueuesResponseSchema.safeParse({
      serverTime: Date.now(),
      queues: [],
    })
    expect(result.success).toBe(true)
  })

  it("should reject a response without serverTime", () => {
    const result = GetQueuesResponseSchema.safeParse({ queues: [] })
    expect(result.success).toBe(false)
  })
})

describe("DlqMessageSchema", () => {
  it("should validate a DLQ message with string payload", () => {
    const result = DlqMessageSchema.safeParse({
      payload: '{"channel":"email"}',
      redelivered: true,
      routing_key: "q.notifications.dlq",
    })
    expect(result.success).toBe(true)
  })

  it("should validate a DLQ message with object payload and full properties", () => {
    const result = DlqMessageSchema.safeParse({
      payload: { channel: "email", to: "user@example.com", subject: "Hi", body: "Hello" },
      properties: {
        delivery_mode: 2,
        headers: { "x-death": [{ count: 1 }] },
      },
      redelivered: false,
      routing_key: "q.notifications.dlq",
    })
    expect(result.success).toBe(true)
  })

  it("should reject a DLQ message missing routing_key", () => {
    const result = DlqMessageSchema.safeParse({
      payload: "raw",
      redelivered: false,
    })
    expect(result.success).toBe(false)
  })

  it("should reject a DLQ message with invalid redelivered type", () => {
    const result = DlqMessageSchema.safeParse({
      payload: "raw",
      redelivered: "yes",
      routing_key: "q.notifications.dlq",
    })
    expect(result.success).toBe(false)
  })
})

describe("DeleteDlqResponseSchema", () => {
  it("should validate { ok: true }", () => {
    const result = DeleteDlqResponseSchema.safeParse({ ok: true })
    expect(result.success).toBe(true)
  })

  it("should reject a response without ok field", () => {
    const result = DeleteDlqResponseSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("should reject a response with a non-boolean ok", () => {
    const result = DeleteDlqResponseSchema.safeParse({ ok: "yes" })
    expect(result.success).toBe(false)
  })
})
