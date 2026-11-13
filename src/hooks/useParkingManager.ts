import { useCallback, useEffect, useRef, useState } from 'react';
import type { LocationReading } from '../domain/entities/LocationReading';
import type { ParkingSpot } from '../domain/entities/ParkingSpot';
import type { ILocationService } from '../domain/interfaces/ILocationService';
import type { INotificationService } from '../domain/interfaces/INotificationService';
import type { IStorageService } from '../domain/interfaces/IStorageService';
import { calculateDistanceInMeters } from '../utils/distanceCalculator';

export interface ParkingManagerDependencies {
  locationService: ILocationService;
  storageService: IStorageService;
  notificationService: INotificationService;
}

export interface ParkingManagerState {
  currentLocation: LocationReading | null;
  savedSpot: ParkingSpot | null;
  distanceToCar: number | null;
  /** Milissegundos restantes até o vencimento do parquímetro; null quando não há timer. */
  remainingTime: number | null;
  isLoading: boolean;
  errorMessage: string | null;
  selectedDurationMinutes: number | null;
  setSelectedDurationMinutes: (minutes: number | null) => void;
  saveParkingSpot: () => Promise<void>;
  finishParking: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  clearError: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useParkingManager({
  locationService,
  storageService,
  notificationService,
}: ParkingManagerDependencies): ParkingManagerState {
  const [currentLocation, setCurrentLocation] = useState<LocationReading | null>(null);
  const [savedSpot, setSavedSpot] = useState<ParkingSpot | null>(null);
  const [distanceToCar, setDistanceToCar] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number | null>(30);
  const unsubscribeLocationRef = useRef<(() => void) | null>(null);

  const updateCurrentLocation = useCallback(
    (location: LocationReading, spot: ParkingSpot | null = savedSpot) => {
      setCurrentLocation(location);
      if (spot) {
        setDistanceToCar(calculateDistanceInMeters(location.coordinates, spot.coordinates));
      }
    },
    [savedSpot],
  );

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);

    storageService
      .getParkingSpot()
      .then(spot => {
        if (!isActive) return;
        setSavedSpot(spot);
        if (spot) {
          setRemainingTime(
            spot.expiresAt ? Math.max(0, Date.parse(spot.expiresAt) - Date.now()) : null,
          );
        }
      })
      .catch(error => {
        if (isActive) setErrorMessage(getErrorMessage(error, 'Não foi possível carregar a vaga salva.'));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [storageService]);

  useEffect(() => {
    let isActive = true;
    unsubscribeLocationRef.current?.();
    unsubscribeLocationRef.current = null;

    if (!savedSpot) {
      setDistanceToCar(null);
      return () => {
        isActive = false;
      };
    }

    const startWatchingLocation = async () => {
      try {
        const permission = await locationService.requestForegroundPermission();
        if (permission !== 'granted') {
          if (isActive) setErrorMessage('Permita o acesso à localização para ver a distância até o carro.');
          return;
        }

        const unsubscribe = await locationService.watchLocation(
          location => {
            if (isActive) updateCurrentLocation(location, savedSpot);
          },
          error => {
            if (isActive) setErrorMessage(getErrorMessage(error, 'Falha ao atualizar sua localização.'));
          },
        );

        if (isActive) unsubscribeLocationRef.current = unsubscribe;
        else unsubscribe();
      } catch (error) {
        if (isActive) setErrorMessage(getErrorMessage(error, 'Não foi possível acompanhar sua localização.'));
      }
    };

    void startWatchingLocation();

    return () => {
      isActive = false;
      unsubscribeLocationRef.current?.();
      unsubscribeLocationRef.current = null;
    };
  }, [locationService, savedSpot, updateCurrentLocation]);

  useEffect(() => {
    if (!savedSpot?.expiresAt) {
      setRemainingTime(null);
      return;
    }

    const expiresAtTimestamp = Date.parse(savedSpot.expiresAt);
    const updateRemainingTime = () => {
      setRemainingTime(Math.max(0, expiresAtTimestamp - Date.now()));
    };

    updateRemainingTime();
    const timerId = setInterval(updateRemainingTime, 1_000);
    return () => clearInterval(timerId);
  }, [savedSpot?.expiresAt]);

  const refreshLocation = useCallback(async () => {
    try {
      const permission = await locationService.requestForegroundPermission();
      if (permission !== 'granted') {
        setErrorMessage('Permita o acesso à localização para encontrar seu carro.');
        return;
      }
      const location = await locationService.getCurrentLocation();
      updateCurrentLocation(location);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível obter sua localização.'));
    }
  }, [locationService, updateCurrentLocation]);

  const saveParkingSpot = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const permission = await locationService.requestForegroundPermission();
      if (permission !== 'granted') {
        setErrorMessage('A permissão de localização é necessária para salvar a vaga.');
        return;
      }

      const location = await locationService.getCurrentLocation();
      const expiresAt = selectedDurationMinutes
        ? new Date(Date.now() + selectedDurationMinutes * 60_000)
        : undefined;

      let reminderNotificationId: string | undefined;
      if (expiresAt) {
        try {
          reminderNotificationId = await notificationService.scheduleParkingReminder({
              title: 'Zona Azul perto do vencimento',
              body: 'Faltam 10 minutos para o vencimento do seu estacionamento.',
              expiresAt,
            }) ?? undefined;
          if (!reminderNotificationId) {
            setErrorMessage('Vaga salva, mas as notificações estão desativadas. Ative-as para receber o alerta.');
          }
        } catch (error) {
          console.warn(
            'Não foi possível agendar o lembrete local de estacionamento.',
            error,
            error instanceof Error && 'originalError' in error ? error.originalError : undefined,
          );
          setErrorMessage('Vaga salva, mas não foi possível agendar o lembrete da Zona Azul.');
        }
      }

      const spot: ParkingSpot = {
        id: `spot-${Date.now()}`,
        coordinates: location.coordinates,
        savedAt: location.capturedAt,
        expiresAt: expiresAt?.toISOString(),
        reminderNotificationId,
      };

      try {
        await storageService.saveParkingSpot(spot);
      } catch (error) {
        if (reminderNotificationId) {
          try {
            await notificationService.cancelReminder(reminderNotificationId);
          } catch {
            // Preserve the storage failure; notification cleanup is best effort.
          }
        }
        throw error;
      }
      setSavedSpot(spot);
      updateCurrentLocation(location, spot);
      setErrorMessage(previous =>
        previous?.startsWith('Vaga salva, mas') ? previous : null,
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível salvar a vaga. Tente novamente.'));
    } finally {
      setIsLoading(false);
    }
  }, [locationService, notificationService, selectedDurationMinutes, storageService, updateCurrentLocation]);

  const finishParking = useCallback(async () => {
    if (!savedSpot) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await storageService.removeParkingSpot();
      if (savedSpot.reminderNotificationId) {
        try {
          await notificationService.cancelReminder(savedSpot.reminderNotificationId);
        } catch {
          setErrorMessage('Vaga liberada, mas não foi possível cancelar o lembrete agendado.');
        }
      }
      setSavedSpot(null);
      setCurrentLocation(null);
      setDistanceToCar(null);
      setRemainingTime(null);
      setSelectedDurationMinutes(30);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível liberar a vaga salva.'));
    } finally {
      setIsLoading(false);
    }
  }, [notificationService, savedSpot, storageService]);

  return {
    currentLocation,
    savedSpot,
    distanceToCar,
    remainingTime,
    isLoading,
    errorMessage,
    selectedDurationMinutes,
    setSelectedDurationMinutes,
    saveParkingSpot,
    finishParking,
    refreshLocation,
    clearError: () => setErrorMessage(null),
  };
}
