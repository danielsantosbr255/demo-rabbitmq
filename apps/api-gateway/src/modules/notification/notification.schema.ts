import { z } from "zod"

export const NotificationChannelSchema = z
  .enum(["email", "sms"])
  .describe("The delivery channel for the notification. Can be email or sms.")

const EmailPayloadSchema = z
  .object({
    channel: z.literal("email").describe("Identifier for the email channel."),
    to: z.email().describe("The recipient email address. Example: user@example.com"),
    subject: z.string().min(1).max(255).describe("The subject of the email. Max 255 characters."),
    body: z.string().min(1).describe("The HTML or plain text body content of the email."),
  })
  .describe("EmailPayload")

const SmsPayloadSchema = z
  .object({
    channel: z.literal("sms").describe("Identifier for the SMS channel."),
    to: z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/, "E.164 format is required")
      .describe("The recipient phone number in E.164 format. Example: +5511999999999"),
    body: z.string().min(1).max(160).describe("The text content of the SMS. Max 160 characters."),
  })
  .describe("SmsPayload")

export const CreateNotificationSchema = z
  .object({
    channel: NotificationChannelSchema,
    payload: z
      .discriminatedUnion("channel", [EmailPayloadSchema, SmsPayloadSchema])
      .describe("The specific payload matching the selected channel."),
  })
  .refine((data) => data.channel === data.payload.channel, {
    message: "Top-level channel must match payload.channel",
    path: ["channel"],
  })

export const EnqueueResultSchema = z
  .object({
    messageId: z
      .string()
      .uuid()
      .describe("The unique identifier for the queued notification. Example: 123e4567-e89b-12d3-a456-426614174000"),
    status: z.literal("queued").describe("The current status of the notification."),
    channel: NotificationChannelSchema,
  })
  .describe("Accepted")

export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>
export type EnqueueResult = z.infer<typeof EnqueueResultSchema>

// Route Schemas for Fastify Swagger Documentation
export const CreateNotificationRouteSchema = {
  tags: ["Notifications"],
  summary: "Create and Enqueue Notification",
  description:
    "Validates and enqueues a new notification message (Email or SMS) for asynchronous processing via RabbitMQ.",
  body: CreateNotificationSchema,
  response: {
    202: EnqueueResultSchema,
  },
}

export const HealthRouteSchema = {
  tags: ["System"],
  summary: "API Gateway Health Check",
  description: "Returns the current health status and timestamp of the API Gateway service.",
  response: {
    200: z
      .object({
        status: z.string().describe("The current health status. Example: ok"),
        service: z.string().describe("The name of the service. Example: api-gateway"),
        timestamp: z.string().describe("ISO-8601 timestamp of the check."),
      })
      .describe("OK"),
  },
}
