import { z } from 'zod';

export const notificationMessageSchema = z.object({
  messageId: z.string(),
  correlationId: z.string(),
  channel: z.literal('email'),
  payload: z.object({
    to: z.email(),
    subject: z.string().min(1),
    body: z.string().min(1),
  }),
  createdAt: z.string(),
  metadata: z.object({
    sourceService: z.string(),
    retryCount: z.number(),
  }),
});