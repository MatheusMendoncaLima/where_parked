import type { ParkingSpot } from '../entities/ParkingSpot';

/** Persistência do último local estacionado. */
export interface IStorageService {
  saveParkingSpot(spot: ParkingSpot): Promise<void>;
  getParkingSpot(): Promise<ParkingSpot | null>;
  removeParkingSpot(): Promise<void>;
}
