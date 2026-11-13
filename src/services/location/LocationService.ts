import * as ExpoLocation from 'expo-location';
import type { LocationReading } from '../../domain/entities/LocationReading';
import type {
  ILocationService,
  LocationPermissionStatus,
} from '../../domain/interfaces/ILocationService';

export type LocationServiceErrorCode = 'PERMISSION_DENIED' | 'LOCATION_UNAVAILABLE';

export class LocationServiceError extends Error {
  constructor(
    message: string,
    public readonly code: LocationServiceErrorCode,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'LocationServiceError';
  }
}

export class LocationService implements ILocationService {
  async requestForegroundPermission(): Promise<LocationPermissionStatus> {
    try {
      const permission = await ExpoLocation.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') return 'granted';
      if (permission.status === 'undetermined') return 'undetermined';
      return 'denied';
    } catch (error) {
      throw new LocationServiceError(
        'Não foi possível solicitar permissão de localização.',
        'LOCATION_UNAVAILABLE',
        error,
      );
    }
  }

  async getCurrentLocation(): Promise<LocationReading> {
    try {
      const permission = await ExpoLocation.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new LocationServiceError(
          'Permissão de localização negada. Autorize o acesso para salvar a vaga.',
          'PERMISSION_DENIED',
        );
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });

      return {
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        accuracyMeters: location.coords.accuracy,
        capturedAt: new Date(location.timestamp).toISOString(),
      };
    } catch (error) {
      if (error instanceof LocationServiceError) throw error;
      throw new LocationServiceError(
        'Não foi possível obter a localização atual. Verifique o GPS e tente novamente.',
        'LOCATION_UNAVAILABLE',
        error,
      );
    }
  }

  async watchLocation(
    onLocation: (location: LocationReading) => void,
    onError: (error: Error) => void,
  ): Promise<() => void> {
    try {
      const permission = await ExpoLocation.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new LocationServiceError(
          'Permissão de localização negada. Autorize o acesso para atualizar a distância.',
          'PERMISSION_DENIED',
        );
      }

      const subscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 3_000,
        },
        location => {
          onLocation({
            coordinates: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            accuracyMeters: location.coords.accuracy,
            capturedAt: new Date(location.timestamp).toISOString(),
          });
        },
        message => onError(new Error(message)),
      );

      return () => subscription.remove();
    } catch (error) {
      if (error instanceof LocationServiceError) throw error;
      throw new LocationServiceError(
        'Não foi possível iniciar o acompanhamento da localização.',
        'LOCATION_UNAVAILABLE',
        error,
      );
    }
  }
}
