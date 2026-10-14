import * as Location from 'expo-location';

/** Asks for foreground location access; resolves to false only when the user refused. */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}
