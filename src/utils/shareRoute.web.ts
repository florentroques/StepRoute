export const canShareRoute = true;

/**
 * Shares the self-contained URL of a route: the native share sheet when the browser has
 * one, otherwise the clipboard. A dismissed share sheet counts as shared.
 */
export async function shareRoute(encodedRoute: string, title: string): Promise<'shared' | 'copied'> {
  const url = `${window.location.origin}/route/${encodedRoute}`;
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) throw e;
    }
    return 'shared';
  }
  await navigator.clipboard.writeText(url);
  return 'copied';
}
