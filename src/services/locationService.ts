import * as Location from 'expo-location';
import { Coordinates } from '../types';
import { requestLocationPermission } from './locationPermission';

export async function getCurrentLocation(): Promise<Coordinates> {
  if (!(await requestLocationPermission())) {
    throw new Error('Permission de localisation refusée');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}
