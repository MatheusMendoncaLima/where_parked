import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParkingMap } from '../components/ParkingMap';
import { ParkingStatusCard } from '../components/ParkingStatusCard';
import { TimerSelector } from '../components/TimerSelector';
import type { ParkingManagerDependencies } from '../hooks/useParkingManager';
import { useParkingManager } from '../hooks/useParkingManager';

interface HomeScreenProps {
  dependencies: ParkingManagerDependencies;
}

function isLocationPermissionError(message: string | null): boolean {
  return Boolean(message && /permiss[aã]o|localiza[cç][aã]o|gps/i.test(message));
}

export function HomeScreen({ dependencies }: HomeScreenProps) {
  const manager = useParkingManager(dependencies);
  const { height: screenHeight } = useWindowDimensions();
  const [routeError, setRouteError] = useState<string | null>(null);
  const mapHeight = Math.min(Math.max(screenHeight * 0.42, 270), 420);
  const showLocationHelp = isLocationPermissionError(manager.errorMessage);

  const openDirections = async () => {
    if (!manager.savedSpot) return;

    const { latitude, longitude } = manager.savedSpot.coordinates;
    const destination = encodeURIComponent(`${latitude},${longitude}`);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;

    try {
      await Linking.openURL(mapsUrl);
      setRouteError(null);
    } catch {
      setRouteError('Não foi possível abrir o Google Maps. Verifique se há um navegador disponível.');
    }
  };

  if (manager.isLoading && !manager.savedSpot) {
    return (
      <SafeAreaView style={styles.loadingScreen} accessibilityRole="progressbar" accessibilityLabel="Carregando vaga salva">
        <ActivityIndicator size="large" color="#1749A6" />
        <Text style={styles.loadingText}>Preparando seu estacionamento…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ESTACIONAMENTO INTELIGENTE</Text>
          <Text style={styles.title}>Onde estacionei?</Text>
        </View>
        <View style={styles.headerBadge} accessibilityLabel="Localização em primeiro plano">
          <Text style={styles.headerBadgeText}>GPS</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mapContainer, { height: mapHeight }]}>
          <ParkingMap
            currentLocation={manager.currentLocation?.coordinates ?? null}
            savedSpot={manager.savedSpot}
          />
          {!manager.savedSpot ? (
            <View style={styles.mapHint} pointerEvents="none">
              <Text style={styles.mapHintText}>Salve sua vaga para encontrar o carro depois</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.panel}>
          {!manager.savedSpot ? (
            <TimerSelector
              selectedMinutes={manager.selectedDurationMinutes}
              onChange={manager.setSelectedDurationMinutes}
            />
          ) : null}

          {showLocationHelp ? (
            <View style={styles.permissionNotice} accessibilityRole="alert">
              <Text style={styles.permissionTitle}>A localização é necessária</Text>
              <Text style={styles.permissionBody}>{manager.errorMessage}</Text>
              <Pressable
                onPress={() => void manager.refreshLocation()}
                style={styles.retryButton}
                accessibilityRole="button"
                accessibilityLabel="Tentar localização novamente"
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          <ParkingStatusCard
            distanceToCar={manager.distanceToCar}
            remainingTime={manager.remainingTime}
            hasSavedSpot={manager.savedSpot !== null}
            isLoading={manager.isLoading}
            errorMessage={showLocationHelp ? routeError : routeError ?? manager.errorMessage}
            onSaveSpot={() => void manager.saveParkingSpot()}
            onOpenDirections={() => void openDirections()}
            onFinishParking={() => void manager.finishParking()}
          />

          {manager.savedSpot ? (
            <Text style={styles.savedAtText}>
              Vaga salva às {new Date(manager.savedSpot.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F6FA' },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
    backgroundColor: '#F3F6FA',
  },
  loadingText: { color: '#475467', fontSize: 15, textAlign: 'center' },
  header: {
    minHeight: 88,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  eyebrow: { marginBottom: 4, color: '#667085', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#182230', fontSize: 23, fontWeight: '800' },
  headerBadge: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#EAF1FF',
  },
  headerBadgeText: { color: '#1749A6', fontSize: 12, fontWeight: '800' },
  scrollContent: { paddingBottom: 24 },
  mapContainer: { overflow: 'hidden', backgroundColor: '#EAF0F7' },
  mapHint: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  mapHintText: { color: '#344054', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  panel: { gap: 14, paddingHorizontal: 16, paddingTop: 16 },
  permissionNotice: {
    gap: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEDF89',
    borderRadius: 16,
    backgroundColor: '#FFFAEB',
  },
  permissionTitle: { color: '#7A2E0E', fontSize: 14, fontWeight: '800' },
  permissionBody: { color: '#7A2E0E', fontSize: 13, lineHeight: 19 },
  retryButton: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: 4 },
  retryButtonText: { color: '#1749A6', fontSize: 14, fontWeight: '700' },
  savedAtText: { color: '#667085', fontSize: 12, textAlign: 'center' },
});
