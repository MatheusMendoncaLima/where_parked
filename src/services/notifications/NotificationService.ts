import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type {
  INotificationService,
  ParkingReminder,
} from '../../domain/interfaces/INotificationService';

const REMINDER_LEAD_TIME_MILLISECONDS = 10 * 60 * 1000;
const REMINDER_CHANNEL_ID = 'parking-reminders';

export class NotificationServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'NotificationServiceError';
  }
}

export class NotificationService implements INotificationService {
  private customChannelAvailable = false;

  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
            name: 'Lembretes de estacionamento',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
          });
          this.customChannelAvailable = true;
        } catch (error) {
          // Expo Go may not expose channel management; try the platform default channel.
          this.customChannelAvailable = false;
          console.warn('Canal personalizado indisponível; usando o canal padrão.', error);
        }
      }

      const currentPermission = await Notifications.getPermissionsAsync();
      if (currentPermission.granted) return true;

      const requestedPermission = await Notifications.requestPermissionsAsync();
      return requestedPermission.granted;
    } catch (error) {
      throw new NotificationServiceError(
        'Não foi possível solicitar permissão para notificações.',
        error,
      );
    }
  }

  async scheduleParkingReminder(reminder: ParkingReminder): Promise<string | null> {
    if (Number.isNaN(reminder.expiresAt.getTime())) {
      throw new NotificationServiceError('A data de vencimento informada é inválida.');
    }

    const triggerAt = new Date(
      reminder.expiresAt.getTime() - REMINDER_LEAD_TIME_MILLISECONDS,
    );
    if (triggerAt.getTime() <= Date.now()) return null;

    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) return null;

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerAt,
          ...(this.customChannelAvailable ? { channelId: REMINDER_CHANNEL_ID } : {}),
        },
      });
    } catch (error) {
      if (error instanceof NotificationServiceError) throw error;
      throw new NotificationServiceError('Não foi possível agendar o lembrete da Zona Azul.', error);
    }
  }

  async cancelReminder(notificationId: string): Promise<void> {
    if (!notificationId.trim()) {
      throw new NotificationServiceError('O identificador da notificação é obrigatório.');
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      throw new NotificationServiceError('Não foi possível cancelar o lembrete agendado.', error);
    }
  }
}
