import {
  calculateDistanceInMeters,
  metersToKilometers,
} from '../../src/utils/distanceCalculator';

describe('distanceCalculator', () => {
  it('returns zero for identical coordinates', () => {
    const point = { latitude: -23.5505, longitude: -46.6333 };

    expect(calculateDistanceInMeters(point, point)).toBe(0);
  });

  it('calculates short distances in meters', () => {
    const origin = { latitude: 0, longitude: 0 };
    const destination = { latitude: 0, longitude: 0.001 };

    expect(calculateDistanceInMeters(origin, destination)).toBeCloseTo(111.2, 0);
  });

  it('converts meters to kilometers', () => {
    expect(metersToKilometers(1_250)).toBe(1.25);
  });

  it('rejects invalid or negative values during kilometer conversion', () => {
    expect(() => metersToKilometers(-1)).toThrow(RangeError);
    expect(() => metersToKilometers(Number.NaN)).toThrow(RangeError);
  });
});
