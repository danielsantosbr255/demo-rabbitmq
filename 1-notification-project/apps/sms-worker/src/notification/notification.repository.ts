import type { ISmsRepository, SendSmsDto } from './notification.types.js';
import { logger } from '../shared/logger/logger.js';

export class StubSmsRepository implements ISmsRepository {
  async send(dto: SendSmsDto): Promise<void> {
    if (dto.body.includes('fail')) {
      throw new Error('Simulated transient SMS transmission failure');
    }
    logger.info(
      { to: dto.to, body: dto.body },
      '[STUB] SMS sent (simulated)',
    );
  }
}
