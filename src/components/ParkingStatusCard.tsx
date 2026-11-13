import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface ParkingStatusCardProps {
  distanceToCar: number | null;
  remainingTime: number | null;
  hasSavedSpot: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onSaveSpot: () => void;
  onOpenDirections: () => void;
  onFinishParking: () => void;
}

function formatDistance(distanceMeters: number | null): string {
  if (distanceMeters === null) return 'Buscando…';
  if (distanceMeters < 1_000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1_000).toFixed(1)} km`;
}

function formatRemainingTime(remainingTime: number | null): string {
  if (remainingTime === null) return 'Sem timer';
  if (remainingTime <= 0) return 'Tempo encerrado';

  const totalMinutes = Math.ceil(remainingTime / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}min` : `${minutes} min`;
}

function ActionButton({
  label,
  onPress,
  disabled,
  variant = 'secondary',
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'danger' && styles.dangerButton,
        disabled && styles.disabledButton,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: disabled }}
    >
      {disabled && variant === 'primary' ? (
        <ActivityIndicator color="#FFFFFF" accessibilityLabel="Processando" />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && styles.primaryButtonText,
            variant === 'danger' && styles.dangerButtonText,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function ParkingStatusCard({
  distanceToCar,
  remainingTime,
  hasSavedSpot,
  isLoading,
  errorMessage,
  onSaveSpot,
  onOpenDirections,
  onFinishParking,
}: ParkingStatusCardProps) {
  return (
    <View style={styles.card} accessibilityLabel="Status do estacionamento">
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Distância até o carro</Text>
          <Text style={styles.metricValue} accessibilityLiveRegion="polite">
            {formatDistance(distanceToCar)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Zona Azul</Text>
          <Text style={styles.metricValue} accessibilityLiveRegion="polite">
            {formatRemainingTime(remainingTime)}
          </Text>
        </View>
      </View>

      {errorMessage ? (
        <Text style={styles.error} accessibilityRole="alert">{errorMessage}</Text>
      ) : null}

      <View style={styles.actions}>
        {!hasSavedSpot ? (
          <ActionButton
            label="Salvar Vaga"
            onPress={onSaveSpot}
            disabled={isLoading}
            variant="primary"
          />
        ) : (
          <>
            <ActionButton
              label="Abrir Rota no Google Maps"
              onPress={onOpenDirections}
              disabled={isLoading}
              variant="primary"
            />
            <ActionButton
              label="Finalizar / Liberar Vaga"
              onPress={onFinishParking}
              disabled={isLoading}
              variant="danger"
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 18,
    gap: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#101828',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  metrics: { flexDirection: 'row', alignItems: 'center' },
  metric: { flex: 1, gap: 5 },
  metricLabel: { color: '#667085', fontSize: 12, fontWeight: '600' },
  metricValue: { color: '#182230', fontSize: 20, fontWeight: '800' },
  divider: { width: 1, height: 42, marginHorizontal: 14, backgroundColor: '#E4E7EC' },
  error: { color: '#B42318', fontSize: 13, lineHeight: 18 },
  actions: { gap: 9 },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: { borderColor: '#1749A6', backgroundColor: '#1749A6' },
  dangerButton: { borderColor: '#FECACA', backgroundColor: '#FFF7F6' },
  disabledButton: { opacity: 0.65 },
  buttonText: { color: '#344054', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  primaryButtonText: { color: '#FFFFFF' },
  dangerButtonText: { color: '#B42318' },
});
