import React from 'react';
import { View } from 'react-native';

export function SafeAreaProvider({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
}

export function SafeAreaView({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) {
  return <View {...(props as object)}>{children}</View>;
}
