import type { GeoCoordinates } from './GeoCoordinates';

/** Local salvo pelo usuário para encontrar o veículo posteriormente. */
export interface ParkingSpot {
  id: string;
  coordinates: GeoCoordinates;
  savedAt: string;
  expiresAt?: string;
  reminderNotificationId?: string;
  label?: string;
  notes?: string;
}
