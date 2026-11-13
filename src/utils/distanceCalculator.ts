import type { GeoCoordinates } from '../domain/entities/GeoCoordinates';

const EARTH_RADIUS_METERS = 6_371_000;

function assertValidCoordinates(point: GeoCoordinates, name: string): void {
  const isLatitudeValid = Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90;
  const isLongitudeValid = Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;

  if (!isLatitudeValid || !isLongitudeValid) {
    throw new RangeError(`${name} must contain valid latitude and longitude values.`);
  }
}

/** Retorna a distância entre dois pontos geográficos em metros (fórmula de Haversine). */
export function calculateDistanceInMeters(
  origin: GeoCoordinates,
  destination: GeoCoordinates,
): number {
  assertValidCoordinates(origin, 'origin');
  assertValidCoordinates(destination, 'destination');

  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

/** Converte uma distância em metros para quilômetros. */
export function metersToKilometers(distanceMeters: number): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    throw new RangeError('distanceMeters must be a finite, non-negative number.');
  }

  return distanceMeters / 1_000;
}
