import type { CreateNotificationDto, EnqueueResult } from "./notification.schema.js"

export type NotificationChannel = "email" | "sms"

export type EmailPayload = {
  to: string
  subject: string
  body: string
}

export type SmsPayload = {
  to: string
  body: string
}

export type NotificationMessage = {
  messageId: string
  correlationId: string
  channel: NotificationChannel
  payload: EmailPayload | SmsPayload
  createdAt: string
  metadata: {
    sourceService: string
    retryCount: number
  }
}

export interface INotificationPublisher {
  publish(message: NotificationMessage): Promise<void>
}

export type { CreateNotificationDto, EnqueueResult }
