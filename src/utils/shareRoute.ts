/** Route URLs only exist on web, where the app has an origin to link to. */
export const canShareRoute = false;

export async function shareRoute(_encodedRoute: string, _title: string): Promise<'shared' | 'copied'> {
  throw new Error('Sharing a route is only available on web');
}
