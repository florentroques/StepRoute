import { LngLat } from '../types';

// stride length ≈ height × 0.413 (biomechanics standard)
export function heightToStrideLength(heightCm: number): number {
  return (heightCm / 100) * 0.413;
}

export function stepsToMeters(steps: number, strideLength = 0.75): number {
  return steps * strideLength;
}

export function metersToSteps(meters: number, strideLength = 0.75): number {
  return Math.round(meters / strideLength);
}

const EARTH_RADIUS_M = 6371000;

/** Great-circle distance in meters between two [longitude, latitude] points. */
export function haversineMeters(a: LngLat, b: LngLat): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
