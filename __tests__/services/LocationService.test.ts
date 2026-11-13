import * as ExpoLocation from 'expo-location';
import {
  LocationService,
  LocationServiceError,
} from '../../src/services/location/LocationService';

jest.mock('expo-location');

describe('LocationService', () => {
  const service = new LocationService();

  beforeEach(() => {
    jest.mocked(ExpoLocation.getForegroundPermissionsAsync).mockResolvedValue({
      status: 'granted',
    } as Awaited<ReturnType<typeof ExpoLocation.getForegroundPermissionsAsync>>);
  });

  it('maps a granted foreground permission to the domain status', async () => {
    jest.mocked(ExpoLocation.requestForegroundPermissionsAsync).mockResolvedValue({
      status: 'granted',
    } as Awaited<ReturnType<typeof ExpoLocation.requestForegroundPermissionsAsync>>);

    await expect(service.requestForegroundPermission()).resolves.toBe('granted');
  });

  it('returns the current coordinates and capture metadata', async () => {
    const capturedAt = new Date('2026-11-13T12:30:00.000Z');
    jest.mocked(ExpoLocation.getCurrentPositionAsync).mockResolvedValue({
      coords: { latitude: -23.55, longitude: -46.63, accuracy: 8 },
      timestamp: capturedAt.getTime(),
    } as Awaited<ReturnType<typeof ExpoLocation.getCurrentPositionAsync>>);

    await expect(service.getCurrentLocation()).resolves.toEqual({
      coordinates: { latitude: -23.55, longitude: -46.63 },
      accuracyMeters: 8,
      capturedAt: capturedAt.toISOString(),
    });
  });

  it('throws a permission error if location access was denied', async () => {
    jest.mocked(ExpoLocation.getForegroundPermissionsAsync).mockResolvedValue({
      status: 'denied',
    } as Awaited<ReturnType<typeof ExpoLocation.getForegroundPermissionsAsync>>);

    await expect(service.getCurrentLocation()).rejects.toMatchObject<Partial<LocationServiceError>>({
      code: 'PERMISSION_DENIED',
    });
  });
});
