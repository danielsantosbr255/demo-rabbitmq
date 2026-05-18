import type { ISmsRepository, SendSmsDto } from './notification.types.js';
import { logger } from '../shared/logger/logger.js';

export class StubSmsRepository implements ISmsRepository {
  async send(dto: SendSmsDto): Promise<void> {
    logger.info(
      { to: dto.to, body: dto.body },
      '[STUB] SMS sent (simulated)',
    );
  }
}
