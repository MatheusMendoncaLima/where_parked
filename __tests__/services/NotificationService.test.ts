import * as Notifications from 'expo-notifications';
import { NotificationService } from '../../src/services/notifications/NotificationService';

jest.mock('expo-notifications');

describe('NotificationService', () => {
  const service = new NotificationService();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-13T11:00:00.000Z'));
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
      granted: true,
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);
    jest.mocked(Notifications.scheduleNotificationAsync).mockResolvedValue('notification-1');
  });

  afterEach(() => jest.useRealTimers());

  it('schedules the reminder exactly ten minutes before expiry', async () => {
    const expiresAt = new Date('2026-11-13T12:00:00.000Z');
    const reminder = { title: 'Zona Azul', body: 'Seu tempo está acabando.', expiresAt };

    await expect(service.scheduleParkingReminder(reminder)).resolves.toBe('notification-1');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date('2026-11-13T11:50:00.000Z'),
        },
      }),
    );
  });

  it('does not schedule when the ten-minute lead time is already past', async () => {
    await expect(
      service.scheduleParkingReminder({
        title: 'Zona Azul',
        body: 'Aviso',
        expiresAt: new Date('2026-11-13T11:05:00.000Z'),
      }),
    ).resolves.toBeNull();

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
