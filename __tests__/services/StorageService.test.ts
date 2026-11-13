import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../../src/services/storage/StorageService';
import type { ParkingSpot } from '../../src/domain/entities/ParkingSpot';

jest.mock('@react-native-async-storage/async-storage');

const storageMock = AsyncStorage as typeof AsyncStorage & { __reset: () => void };

const parkingSpot: ParkingSpot = {
  id: 'spot-1',
  coordinates: { latitude: -23.5505, longitude: -46.6333 },
  savedAt: '2026-11-13T12:00:00.000Z',
  label: 'Piso G2, setor azul',
};

describe('StorageService', () => {
  const service = new StorageService();

  beforeEach(() => storageMock.__reset());

  it('saves a parking spot as JSON', async () => {
    await service.saveParkingSpot(parkingSpot);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@onde-estacionei/parking-spot',
      JSON.stringify(parkingSpot),
    );
  });

  it('returns an existing parking spot', async () => {
    await service.saveParkingSpot(parkingSpot);

    await expect(service.getParkingSpot()).resolves.toEqual(parkingSpot);
  });

  it('returns null when no parking spot is stored', async () => {
    await expect(service.getParkingSpot()).resolves.toBeNull();
  });

  it('removes the stored parking spot', async () => {
    await service.saveParkingSpot(parkingSpot);
    await service.removeParkingSpot();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@onde-estacionei/parking-spot');
    await expect(service.getParkingSpot()).resolves.toBeNull();
  });
});
