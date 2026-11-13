import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import type { GeoCoordinates } from '../domain/entities/GeoCoordinates';
import type { ParkingSpot } from '../domain/entities/ParkingSpot';

interface ParkingMapProps {
  currentLocation: GeoCoordinates | null;
  savedSpot: ParkingSpot | null;
}

const DEFAULT_COORDINATES: GeoCoordinates = { latitude: -23.5505, longitude: -46.6333 };

function getMapRegion(
  currentLocation: GeoCoordinates | null,
  parkingCoordinates: GeoCoordinates | null,
): Region {
  if (currentLocation && parkingCoordinates) {
    return {
      latitude: (currentLocation.latitude + parkingCoordinates.latitude) / 2,
      longitude: (currentLocation.longitude + parkingCoordinates.longitude) / 2,
      latitudeDelta: Math.max(0.006, Math.abs(currentLocation.latitude - parkingCoordinates.latitude) * 1.6),
      longitudeDelta: Math.max(0.006, Math.abs(currentLocation.longitude - parkingCoordinates.longitude) * 1.6),
    };
  }

  const coordinates = currentLocation ?? parkingCoordinates ?? DEFAULT_COORDINATES;
  return {
    ...coordinates,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  };
}

export function ParkingMap({ currentLocation, savedSpot }: ParkingMapProps) {
  const region = getMapRegion(currentLocation, savedSpot?.coordinates ?? null);
  const routeCoordinates =
    currentLocation && savedSpot
      ? [currentLocation, savedSpot.coordinates]
      : [];

  return (
    <View style={styles.container} accessible accessibilityLabel="Mapa da sua localização e da vaga salva">
      <MapView
        style={styles.map}
        initialRegion={region}
        region={region}
        showsCompass
        showsScale
        toolbarEnabled={false}
        accessibilityLabel="Mapa de estacionamento"
      >
        {currentLocation ? (
          <Marker
            coordinate={currentLocation}
            title="Você está aqui"
            description="Sua localização atual"
            pinColor="#2563EB"
            accessibilityLabel="Marcador da sua localização atual"
          />
        ) : null}
        {savedSpot ? (
          <Marker
            coordinate={savedSpot.coordinates}
            title={savedSpot.label ?? 'Seu carro'}
            description="Local onde você estacionou"
            pinColor="#E85D3F"
            accessibilityLabel="Marcador do carro estacionado"
          />
        ) : null}
        {routeCoordinates.length === 2 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2563EB"
            strokeWidth={4}
            lineDashPattern={[8, 6]}
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', backgroundColor: '#EAF0F7' },
  map: { flex: 1 },
});
