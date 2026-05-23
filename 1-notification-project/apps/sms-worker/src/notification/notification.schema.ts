import { z } from 'zod/v4';

export const notificationMessageSchema = z.object({
  messageId: z.string(),
  correlationId: z.string(),
  channel: z.literal('sms'),
  payload: z.object({
    to: z.string(),
    body: z.string().min(1),
  }),
  createdAt: z.string(),
  metadata: z.object({
    sourceService: z.string(),
    retryCount: z.number(),
  }),
});

export type NotificationMessage = z.infer<typeof notificationMessageSchema>;
