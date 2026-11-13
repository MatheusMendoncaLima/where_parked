export interface ParkingReminder {
  title: string;
  body: string;
  /** Data/hora de vencimento; o serviço agenda o aviso 10 minutos antes. */
  expiresAt: Date;
}

/** Contrato de notificações locais, sem dependência do Expo no domínio. */
export interface INotificationService {
  requestPermission(): Promise<boolean>;
  scheduleParkingReminder(reminder: ParkingReminder): Promise<string | null>;
  cancelReminder(notificationId: string): Promise<void>;
}
