import { describe, expect, it } from "vitest"
import { CreateNotificationSchema, EnqueueResultSchema } from "../src/modules/notification/notification.schema.js"

describe("CreateNotificationSchema", () => {
  it("should validate a valid email payload", () => {
    const result = CreateNotificationSchema.safeParse({
      channel: "email",
      payload: { channel: "email", to: "user@example.com", subject: "Hello", body: "World" },
    })
    expect(result.success).toBe(true)
  })

  it("should reject an invalid email address", () => {
    const result = CreateNotificationSchema.safeParse({
      channel: "email",
      payload: { channel: "email", to: "not-an-email", subject: "S", body: "B" },
    })
    expect(result.success).toBe(false)
  })

  it("should validate a valid SMS payload with E.164 number", () => {
    const result = CreateNotificationSchema.safeParse({
      channel: "sms",
      payload: { channel: "sms", to: "+5511999990000", body: "Hi" },
    })
    expect(result.success).toBe(true)
  })

  it("should reject an SMS number without + prefix", () => {
    const result = CreateNotificationSchema.safeParse({
      channel: "sms",
      payload: { channel: "sms", to: "5511999990000", body: "Hi" },
    })
    expect(result.success).toBe(false)
  })

  it("should reject SMS body longer than 160 chars", () => {
    const result = CreateNotificationSchema.safeParse({
      channel: "sms",
      payload: { channel: "sms", to: "+5511999990000", body: "x".repeat(161) },
    })
    expect(result.success).toBe(false)
  })

  it("should reject unknown channel", () => {
    const result = CreateNotificationSchema.safeParse({
      channel: "whatsapp",
      payload: { channel: "whatsapp", to: "+55119", body: "Hi" },
    })
    expect(result.success).toBe(false)
  })

  it("should reject mismatched channel vs payload channel", () => {
    const result = CreateNotificationSchema.safeParse({
      channel: "email",
      payload: { channel: "sms", to: "+5511999990000", body: "Hi" },
    })
    expect(result.success).toBe(false)
  })
})

describe("EnqueueResultSchema", () => {
  it("should validate a correct result", () => {
    const result = EnqueueResultSchema.safeParse({
      messageId: "550e8400-e29b-41d4-a716-446655440000",
      status: "queued",
      channel: "email",
    })
    expect(result.success).toBe(true)
  })
})
