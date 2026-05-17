import { z } from 'zod/v4';

export const NotificationChannelSchema = z.enum(['email', 'sms', 'push']);

const EmailPayloadSchema = z.object({
  channel: z.literal('email'),
  to: z.email(),
  subject: z.string().min(1).max(255),
  body: z.string().min(1),
});

const SmsPayloadSchema = z.object({
  channel: z.literal('sms'),
  to: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Formato E.164 obrigatório'),
  body: z.string().min(1).max(160),
});

const PushPayloadSchema = z.object({
  channel: z.literal('push'),
  deviceToken: z.string().min(1),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(256),
});

export const CreateNotificationSchema = z.object({
  channel: NotificationChannelSchema,
  payload: z.discriminatedUnion('channel', [
    EmailPayloadSchema,
    SmsPayloadSchema,
    PushPayloadSchema,
  ]),
}).refine((data) => data.channel === data.payload.channel, {
  message: 'Top-level channel must match payload.channel',
  path: ['channel'],
});

export const EnqueueResultSchema = z.object({
  messageId: z.string().uuid(),
  status: z.literal('queued'),
  channel: NotificationChannelSchema,
});

export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>;
export type EnqueueResult = z.infer<typeof EnqueueResultSchema>;
