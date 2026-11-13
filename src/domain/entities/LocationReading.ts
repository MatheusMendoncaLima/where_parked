import type { GeoCoordinates } from './GeoCoordinates';

export interface LocationReading {
  coordinates: GeoCoordinates;
  accuracyMeters: number | null;
  capturedAt: string;
}
