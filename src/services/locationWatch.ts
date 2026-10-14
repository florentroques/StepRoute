import * as Location from 'expo-location';

export interface LocationFix {
  longitude: number;
  latitude: number;
  accuracy: number | null;
}

export interface LocationWatch {
  remove(): void;
}

/** Streams position updates until `remove()` is called. Permission must already be granted. */
export async function watchLocation(onFix: (fix: LocationFix) => void): Promise<LocationWatch> {
  return Location.watchPositionAsync(
    { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3 },
    ({ coords }) =>
      onFix({ longitude: coords.longitude, latitude: coords.latitude, accuracy: coords.accuracy }),
  );
}
