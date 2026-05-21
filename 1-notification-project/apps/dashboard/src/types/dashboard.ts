export interface QueueStats {
  name: string;
  messages: number;
  messagesUnacked?: number;
  ttl: number | null;
  headTimestamp: number | null;
}

export interface DeadLetter {
  payload_bytes: number;
  message_count: number;
  properties: {
    message_id?: string;
    headers?: Record<string, unknown>;
  };
  payload: string;
}

export interface LogEvent {
  id: string;
  time: Date;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

export type NotificationChannel = 'email' | 'sms';

export interface NotificationFormData {
  channel: NotificationChannel;
  to: string;
  subject: string;
  body: string;
}
