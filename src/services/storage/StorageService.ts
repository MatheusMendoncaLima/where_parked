import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GeoCoordinates } from '../../domain/entities/GeoCoordinates';
import type { ParkingSpot } from '../../domain/entities/ParkingSpot';
import type { IStorageService } from '../../domain/interfaces/IStorageService';

const PARKING_SPOT_STORAGE_KEY = '@onde-estacionei/parking-spot';

export class StorageServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'StorageServiceError';
  }
}

function isGeoCoordinates(value: unknown): value is GeoCoordinates {
  if (typeof value !== 'object' || value === null) return false;
  const coordinates = value as Record<string, unknown>;
  return (
    typeof coordinates.latitude === 'number' &&
    Number.isFinite(coordinates.latitude) &&
    Math.abs(coordinates.latitude) <= 90 &&
    typeof coordinates.longitude === 'number' &&
    Number.isFinite(coordinates.longitude) &&
    Math.abs(coordinates.longitude) <= 180
  );
}

function isParkingSpot(value: unknown): value is ParkingSpot {
  if (typeof value !== 'object' || value === null) return false;
  const spot = value as Record<string, unknown>;
  return (
    typeof spot.id === 'string' &&
    spot.id.length > 0 &&
    isGeoCoordinates(spot.coordinates) &&
    typeof spot.savedAt === 'string' &&
    !Number.isNaN(Date.parse(spot.savedAt)) &&
    (spot.label === undefined || typeof spot.label === 'string') &&
    (spot.notes === undefined || typeof spot.notes === 'string') &&
    (spot.expiresAt === undefined ||
      (typeof spot.expiresAt === 'string' && !Number.isNaN(Date.parse(spot.expiresAt)))) &&
    (spot.reminderNotificationId === undefined ||
      typeof spot.reminderNotificationId === 'string')
  );
}

export class StorageService implements IStorageService {
  async saveParkingSpot(spot: ParkingSpot): Promise<void> {
    if (!isParkingSpot(spot)) {
      throw new StorageServiceError('Os dados da vaga são inválidos e não puderam ser salvos.');
    }

    try {
      await AsyncStorage.setItem(PARKING_SPOT_STORAGE_KEY, JSON.stringify(spot));
    } catch (error) {
      throw new StorageServiceError('Não foi possível salvar a vaga neste dispositivo.', error);
    }
  }

  async getParkingSpot(): Promise<ParkingSpot | null> {
    let serializedSpot: string | null;
    try {
      serializedSpot = await AsyncStorage.getItem(PARKING_SPOT_STORAGE_KEY);
    } catch (error) {
      throw new StorageServiceError('Não foi possível recuperar a vaga salva.', error);
    }

    if (serializedSpot === null) return null;

    try {
      const parsedSpot: unknown = JSON.parse(serializedSpot);
      if (!isParkingSpot(parsedSpot)) {
        throw new Error('Stored parking spot does not match the expected format.');
      }
      return parsedSpot;
    } catch (error) {
      throw new StorageServiceError('Os dados da vaga salva estão inválidos ou corrompidos.', error);
    }
  }

  async removeParkingSpot(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PARKING_SPOT_STORAGE_KEY);
    } catch (error) {
      throw new StorageServiceError('Não foi possível limpar a vaga salva.', error);
    }
  }
}
