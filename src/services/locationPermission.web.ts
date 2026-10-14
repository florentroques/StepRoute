/**
 * Browsers prompt on the first geolocation call. expo-location's web version throws when the
 * Permissions API is missing and reports timeouts as granted, so ask the browser directly.
 * Only an explicit refusal counts as denied: a timeout or a missing fix is left to the
 * position watch to surface.
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!('geolocation' in navigator)) return false;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      (error) => resolve(error.code !== error.PERMISSION_DENIED),
      { timeout: 15000 },
    );
  });
}
