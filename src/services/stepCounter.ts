import { Pedometer } from 'expo-sensors';

export interface StepSubscription {
  remove(): void;
}

/**
 * Starts counting steps from zero. Resolves to null when the device exposes no
 * pedometer or the user refused the motion permission.
 */
export async function watchSteps(
  onSteps: (steps: number) => void,
): Promise<StepSubscription | null> {
  const { status } = await Pedometer.requestPermissionsAsync();
  if (status !== 'granted') return null;
  if (!(await Pedometer.isAvailableAsync())) return null;
  return Pedometer.watchStepCount(({ steps }) => onSteps(steps));
}
