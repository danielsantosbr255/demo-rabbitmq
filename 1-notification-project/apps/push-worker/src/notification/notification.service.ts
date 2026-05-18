import type { IPushRepository, PushPayload } from './notification.types.js';
import { FatalNotificationError } from '../shared/errors/app.error.js';
import { logger } from '../shared/logger/logger.js';

export class PushNotificationService {
  constructor(private readonly pushRepo: IPushRepository) {}

  async process(messageId: string, payload: PushPayload): Promise<void> {
    logger.info({ messageId, deviceToken: payload.deviceToken }, 'Processing push notification');

    if (!payload.deviceToken || !payload.title) {
      throw new FatalNotificationError('Invalid push payload: missing required fields');
    }

    await this.pushRepo.send({
      deviceToken: payload.deviceToken,
      title: payload.title,
      body: payload.body,
    });

    logger.info({ messageId, deviceToken: payload.deviceToken }, 'Push notification sent successfully');
  }
}
