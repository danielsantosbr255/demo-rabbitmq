import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../src/modules/notification/notification.service.js';
import type { INotificationPublisher, NotificationMessage } from '../src/modules/notification/notification.types.js';

const mockPublisher: INotificationPublisher = {
  publish: vi.fn(),
};

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enqueue an email notification and return 202 shape', async () => {
    const service = new NotificationService(mockPublisher);

    const result = await service.enqueue({
      channel: 'email',
      payload: {
        channel: 'email',
        to: 'user@example.com',
        subject: 'Welcome',
        body: 'Hello!',
      },
    });

    expect(result.status).toBe('queued');
    expect(result.channel).toBe('email');
    expect(result.messageId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('should call publisher.publish exactly once with correct channel', async () => {
    const service = new NotificationService(mockPublisher);

    await service.enqueue({
      channel: 'sms',
      payload: { channel: 'sms', to: '+5511999990000', body: 'Test' },
    });

    expect(mockPublisher.publish).toHaveBeenCalledOnce();
    const msg = vi.mocked(mockPublisher.publish).mock.calls[0]?.[0] as NotificationMessage;
    expect(msg.channel).toBe('sms');
    expect(msg.metadata.sourceService).toBe('api-gateway');
    expect(msg.metadata.retryCount).toBe(0);
  });

  it('should generate unique messageIds for each call', async () => {
    const service = new NotificationService(mockPublisher);

    const [r1, r2] = await Promise.all([
      service.enqueue({
        channel: 'sms',
        payload: { channel: 'sms', to: '+5511999990001', body: 'Test1' },
      }),
      service.enqueue({
        channel: 'sms',
        payload: { channel: 'sms', to: '+5511999990002', body: 'Test2' },
      }),
    ]);

    expect(r1.messageId).not.toBe(r2.messageId);
  });

  it('should propagate publisher errors', async () => {
    vi.mocked(mockPublisher.publish).mockRejectedValueOnce(new Error('Broker unavailable'));
    const service = new NotificationService(mockPublisher);

    await expect(
      service.enqueue({
        channel: 'email',
        payload: { channel: 'email', to: 'a@b.com', subject: 'S', body: 'B' },
      }),
    ).rejects.toThrow('Broker unavailable');
  });
});
