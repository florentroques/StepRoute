import type { LocationFix, LocationWatch } from './locationWatch';

/**
 * Uses the browser API directly: expo-location's web subscription.remove() throws
 * (`LocationEventEmitter.removeSubscription is not a function`), which would leave a
 * walk impossible to stop.
 */
export async function watchLocation(onFix: (fix: LocationFix) => void): Promise<LocationWatch> {
  const id = navigator.geolocation.watchPosition(
    ({ coords }) =>
      onFix({ longitude: coords.longitude, latitude: coords.latitude, accuracy: coords.accuracy }),
    undefined,
    { enableHighAccuracy: true },
  );
  return { remove: () => navigator.geolocation.clearWatch(id) };
}
