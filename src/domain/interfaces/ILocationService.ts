import type { LocationReading } from '../entities/LocationReading';

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/** Contrato independente do provedor de GPS/plataforma. */
export interface ILocationService {
  requestForegroundPermission(): Promise<LocationPermissionStatus>;
  getCurrentLocation(): Promise<LocationReading>;
  /** Assina atualizações enquanto o app está ativo e retorna uma função de cancelamento. */
  watchLocation(
    onLocation: (location: LocationReading) => void,
    onError: (error: Error) => void,
  ): Promise<() => void>;
}
