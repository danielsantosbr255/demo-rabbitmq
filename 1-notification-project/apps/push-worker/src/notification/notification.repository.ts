import type { IPushRepository, SendPushDto } from './notification.types.js';
import { logger } from '../shared/logger/logger.js';

export class StubPushRepository implements IPushRepository {
  async send(dto: SendPushDto): Promise<void> {
    logger.info(
      { deviceToken: dto.deviceToken, title: dto.title, body: dto.body },
      '[STUB] Push notification sent (simulated)',
    );
  }
}
