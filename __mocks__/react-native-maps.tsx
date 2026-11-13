import React from 'react';
import { View } from 'react-native';

interface MockMapProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

function MockMapView({ children }: MockMapProps) {
  return <View testID="mock-map-view">{children}</View>;
}

function MockMarker({ children }: MockMapProps) {
  return <View testID="mock-map-marker">{children}</View>;
}

function MockPolyline() {
  return null;
}

export const Marker = MockMarker;
export const Polyline = MockPolyline;
export default MockMapView;
