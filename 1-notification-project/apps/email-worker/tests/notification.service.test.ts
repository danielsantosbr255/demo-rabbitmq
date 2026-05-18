import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailNotificationService } from '../src/notification/notification.service.js';
import { FatalNotificationError } from '../src/shared/errors/app.error.js';
import type { IEmailRepository } from '../src/notification/notification.types.js';

const mockRepo: IEmailRepository = {
  send: vi.fn(),
};

describe('EmailNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call repository.send with correct args', async () => {
    const service = new EmailNotificationService(mockRepo);

    await service.process('msg-1', {
      to: 'user@example.com',
      subject: 'Test',
      body: 'Hello',
    });

    expect(mockRepo.send).toHaveBeenCalledOnce();
    expect(mockRepo.send).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Test',
      body: 'Hello',
    });
  });

  it('should throw FatalNotificationError when "to" is missing', async () => {
    const service = new EmailNotificationService(mockRepo);

    await expect(
      service.process('msg-2', { to: '', subject: 'S', body: 'B' }),
    ).rejects.toThrow(FatalNotificationError);

    expect(mockRepo.send).not.toHaveBeenCalled();
  });

  it('should throw FatalNotificationError when "subject" is missing', async () => {
    const service = new EmailNotificationService(mockRepo);

    await expect(
      service.process('msg-3', { to: 'a@b.com', subject: '', body: 'B' }),
    ).rejects.toThrow(FatalNotificationError);
  });

  it('should propagate repository errors', async () => {
    vi.mocked(mockRepo.send).mockRejectedValueOnce(new Error('SMTP error'));
    const service = new EmailNotificationService(mockRepo);

    await expect(
      service.process('msg-4', { to: 'a@b.com', subject: 'S', body: 'B' }),
    ).rejects.toThrow('SMTP error');
  });
});
