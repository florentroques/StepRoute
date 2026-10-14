import { Coordinates, HistoryEntry, RouteType } from '../types';

/** Everything needed to display a route; this is what a route URL carries. */
export type SharedRoute = Pick<
  HistoryEntry,
  'routeType' | 'steps' | 'distanceMeters' | 'geometry' | 'ascent' | 'descent'
>;

// Route URLs look like `/route/<type>~<steps>~<meters>~<ascent>~<descent>~<path>`.
// The path is a Google-polyline-style delta encoding (1e-5° ≈ 1 m) written with the
// URL-safe base64 alphabet, so a route stays self-contained and shareable.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const SEPARATOR = '~';
const PRECISION = 1e5;

const TYPE_CODES: Record<RouteType, string> = { loop: 'l', 'one-way': 'o', 'round-trip': 'r' };
const CODE_TYPES = Object.fromEntries(
  Object.entries(TYPE_CODES).map(([type, code]) => [code, type]),
) as Record<string, RouteType>;

function encodeValue(value: number): string {
  let rest = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (rest >= 0x20) {
    out += ALPHABET[(0x20 | (rest & 0x1f))];
    rest >>= 5;
  }
  return out + ALPHABET[rest];
}

function encodePath(geometry: Coordinates[]): string {
  let lat = 0;
  let lng = 0;
  let out = '';
  for (const point of geometry) {
    const nextLat = Math.round(point.latitude * PRECISION);
    const nextLng = Math.round(point.longitude * PRECISION);
    out += encodeValue(nextLat - lat) + encodeValue(nextLng - lng);
    lat = nextLat;
    lng = nextLng;
  }
  return out;
}

function decodePath(path: string): Coordinates[] | null {
  const geometry: Coordinates[] = [];
  const values: number[] = [];
  let shift = 0;
  let acc = 0;
  for (const char of path) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) return null;
    acc |= (index & 0x1f) << shift;
    if (index >= 0x20) {
      shift += 5;
      continue;
    }
    values.push(acc & 1 ? ~(acc >> 1) : acc >> 1);
    acc = 0;
    shift = 0;
  }
  if (shift !== 0 || values.length % 2 !== 0) return null;
  let lat = 0;
  let lng = 0;
  for (let i = 0; i < values.length; i += 2) {
    lat += values[i];
    lng += values[i + 1];
    geometry.push({ latitude: lat / PRECISION, longitude: lng / PRECISION });
  }
  return geometry;
}

const optionalNumber = (n: number | undefined) => (n === undefined ? '' : String(Math.round(n)));

export function encodeRoute(route: SharedRoute): string {
  return [
    TYPE_CODES[route.routeType],
    Math.round(route.steps),
    Math.round(route.distanceMeters),
    optionalNumber(route.ascent),
    optionalNumber(route.descent),
    encodePath(route.geometry),
  ].join(SEPARATOR);
}

/** Returns null when the string is not a valid route, e.g. a mistyped or truncated URL. */
export function decodeRoute(encoded: string): SharedRoute | null {
  const [type, steps, meters, ascent, descent, path, ...extra] = encoded.split(SEPARATOR);
  const routeType = CODE_TYPES[type];
  if (!routeType || path === undefined || extra.length > 0) return null;
  const geometry = decodePath(path);
  const numbers = [steps, meters].map(Number);
  if (!geometry || geometry.length < 2 || numbers.some((n) => !Number.isFinite(n) || n < 0)) {
    return null;
  }
  const optional = (s: string) => (s === '' ? undefined : Number(s));
  const [ascentValue, descentValue] = [optional(ascent), optional(descent)];
  if ([ascentValue, descentValue].some((n) => n !== undefined && !Number.isFinite(n))) return null;
  return {
    routeType,
    steps: numbers[0],
    distanceMeters: numbers[1],
    geometry,
    ascent: ascentValue,
    descent: descentValue,
  };
}
