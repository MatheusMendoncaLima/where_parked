import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from '../../src/screens/HomeScreen';
import type { LocationReading } from '../../src/domain/entities/LocationReading';
import type { ParkingSpot } from '../../src/domain/entities/ParkingSpot';
import type { ParkingManagerDependencies } from '../../src/hooks/useParkingManager';

jest.mock('react-native-maps');
jest.mock('react-native-safe-area-context');

const parkedLocation: LocationReading = {
  coordinates: { latitude: -23.5505, longitude: -46.6333 },
  accuracyMeters: 5,
  capturedAt: '2026-11-13T12:00:00.000Z',
};

const walkingLocation: LocationReading = {
  coordinates: { latitude: -23.5515, longitude: -46.6333 },
  accuracyMeters: 5,
  capturedAt: '2026-11-13T12:01:00.000Z',
};

function createDependencies(): ParkingManagerDependencies & {
  storedSpot: ParkingSpot | null;
  removeParkingSpot: jest.Mock;
  saveParkingSpot: jest.Mock;
} {
  const context: { storedSpot: ParkingSpot | null } = { storedSpot: null };
  const removeParkingSpot = jest.fn(async () => {
    context.storedSpot = null;
  });
  const saveParkingSpot = jest.fn(async (spot: ParkingSpot) => {
    context.storedSpot = spot;
  });

  return {
    storedSpot: null,
    locationService: {
      requestForegroundPermission: jest.fn(async () => 'granted' as const),
      getCurrentLocation: jest.fn(async () => parkedLocation),
      watchLocation: jest.fn(async (onLocation: (location: LocationReading) => void) => {
        onLocation(walkingLocation);
        return jest.fn();
      }),
    },
    storageService: {
      getParkingSpot: jest.fn(async () => context.storedSpot),
      saveParkingSpot,
      removeParkingSpot,
    },
    notificationService: {
      requestPermission: jest.fn(async () => true),
      scheduleParkingReminder: jest.fn(async () => 'reminder-1'),
      cancelReminder: jest.fn(async () => undefined),
    },
    removeParkingSpot,
    saveParkingSpot,
  };
}

describe('HomeScreen', () => {
  it('saves a parking spot, shows live distance and time, then returns to the empty state', async () => {
    const dependencies = createDependencies();
    const { findByText, getByRole, getByText } = await render(
      <SafeAreaProvider><HomeScreen dependencies={dependencies} /></SafeAreaProvider>,
    );

    expect(await findByText('Salve sua vaga para encontrar o carro depois')).toBeTruthy();
    await fireEvent.press(getByRole('button', { name: 'Salvar Vaga' }));

    await waitFor(() => expect(dependencies.saveParkingSpot).toHaveBeenCalledTimes(1));
    expect(await findByText('30 min')).toBeTruthy();
    expect(await findByText('111 m')).toBeTruthy();
    expect(getByRole('button', { name: 'Abrir Rota no Google Maps' })).toBeTruthy();

    await fireEvent.press(getByRole('button', { name: 'Finalizar / Liberar Vaga' }));

    await waitFor(() => expect(dependencies.removeParkingSpot).toHaveBeenCalledTimes(1));
    expect(await findByText('Sem timer')).toBeTruthy();
    expect(getByText('Buscando…')).toBeTruthy();
    expect(getByRole('button', { name: 'Salvar Vaga' })).toBeTruthy();
    expect(getByRole('radio', { name: '30 min', checked: true })).toBeTruthy();
  });

  it('shows a clear GPS permission message and retry action when access is denied', async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.locationService.requestForegroundPermission).mockResolvedValue('denied');
    const { findByText, getByRole } = await render(
      <SafeAreaProvider><HomeScreen dependencies={dependencies} /></SafeAreaProvider>,
    );

    await findByText('Salve sua vaga para encontrar o carro depois');
    await fireEvent.press(getByRole('button', { name: 'Salvar Vaga' }));

    expect(await findByText('A localização é necessária')).toBeTruthy();
    expect(getByRole('button', { name: 'Tentar localização novamente' })).toBeTruthy();
    expect(dependencies.locationService.getCurrentLocation).not.toHaveBeenCalled();
  });
});
