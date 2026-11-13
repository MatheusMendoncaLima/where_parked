import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface TimerSelectorProps {
  selectedMinutes: number | null;
  onChange: (minutes: number | null) => void;
}

const PRESET_OPTIONS = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 hora' },
  { minutes: 120, label: '2 horas' },
];

export function TimerSelector({ selectedMinutes, onChange }: TimerSelectorProps) {
  const isCustomSelected =
    selectedMinutes !== null && !PRESET_OPTIONS.some(option => option.minutes === selectedMinutes);
  const [isCustomMode, setIsCustomMode] = useState(isCustomSelected);
  const [customValue, setCustomValue] = useState(isCustomSelected ? String(selectedMinutes) : '');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const selectPreset = (minutes: number) => {
    setIsCustomMode(false);
    setValidationMessage(null);
    onChange(minutes);
  };

  const selectCustom = () => {
    setIsCustomMode(true);
    if (!customValue) onChange(null);
  };

  const updateCustomValue = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    setCustomValue(digitsOnly);
    const minutes = Number.parseInt(digitsOnly, 10);

    if (!digitsOnly) {
      onChange(null);
      setValidationMessage(null);
    } else if (minutes < 5 || minutes > 480) {
      onChange(null);
      setValidationMessage('Escolha entre 5 e 480 minutos.');
    } else {
      onChange(minutes);
      setValidationMessage(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tempo da Zona Azul</Text>
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Duração do estacionamento">
        {PRESET_OPTIONS.map(option => {
          const selected = !isCustomMode && selectedMinutes === option.minutes;
          return (
            <Pressable
              key={option.minutes}
              onPress={() => selectPreset(option.minutes)}
              style={[styles.option, selected && styles.optionSelected]}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={option.label}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={selectCustom}
          style={[styles.option, isCustomMode && styles.optionSelected]}
          accessibilityRole="radio"
          accessibilityState={{ checked: isCustomMode }}
          accessibilityLabel="Duração personalizada"
        >
          <Text style={[styles.optionText, isCustomMode && styles.optionTextSelected]}>Personalizado</Text>
        </Pressable>
      </View>
      {isCustomMode ? (
        <View style={styles.customContainer}>
          <TextInput
            value={customValue}
            onChangeText={updateCustomValue}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="Minutos"
            placeholderTextColor="#687386"
            style={styles.input}
            accessibilityLabel="Duração personalizada em minutos"
            accessibilityHint="Informe um valor de 5 a 480 minutos"
          />
          <Text style={styles.unit}>minutos</Text>
        </View>
      ) : null}
      {validationMessage ? (
        <Text style={styles.validation} accessibilityRole="alert">{validationMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  title: { color: '#182230', fontSize: 15, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8DEE8',
    backgroundColor: '#F7F9FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: { borderColor: '#2563EB', backgroundColor: '#EAF1FF' },
  optionText: { color: '#475467', fontSize: 13, fontWeight: '600' },
  optionTextSelected: { color: '#1749A6' },
  customContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    minWidth: 110,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8DEE8',
    color: '#182230',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  unit: { color: '#475467', fontSize: 14 },
  validation: { color: '#B42318', fontSize: 12 },
});
