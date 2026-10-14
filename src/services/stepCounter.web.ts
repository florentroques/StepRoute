export interface StepSubscription {
  remove(): void;
}

/** Browsers expose no pedometer; callers fall back to showing no live steps. */
export async function watchSteps(
  _onSteps: (steps: number) => void,
): Promise<StepSubscription | null> {
  return null;
}
