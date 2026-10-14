# Architecture

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- React Navigation
- Zustand with AsyncStorage persistence
- MapLibre React Native
- Axios
- Nominatim geocoding
- Cloudflare Worker route proxy

## High-Level Flow

```txt
Screens
  |
  v
Zustand store
  |
  v
Services
  |
  v
External services
```

Screens own the user interaction. The store owns local app state and persisted preferences. Services isolate location, geocoding, routing, step conversion, and export behavior.

## Navigation

```txt
Stack Navigator
  |
  +-- Tab Navigator
  |     +-- HomeScreen
  |     +-- HistoryScreen
  |     +-- FavoritesScreen
  |     +-- SettingsScreen
  |
  +-- MapScreen
  +-- PrivacyPolicyScreen
```

The tab navigator handles the main app sections. `MapScreen` is pushed on top after a route is generated or selected from history/favorites.

`MapScreen` takes a single `route` param: the whole route, serialized by `src/navigation/routeCodec.ts`. It decodes the param to render, so it never depends on the store. Param types live in `src/navigation/types.ts`.

### Web URLs

On web, `src/navigation/linking.ts` maps screens to paths, so the address bar, browser back/forward and reloads work. Native does not use it.

| Screen | Path |
| --- | --- |
| Home | `/` |
| History | `/history` |
| Favorites | `/favorites` |
| Settings | `/settings` |
| Map | `/route/<encoded route>` |
| Privacy policy | `/privacy` |

A route URL is self-contained: `/route/<type>~<steps>~<meters>~<ascent>~<descent>~<path>`. `<type>` is `l`, `o` or `r` (loop, one-way, round-trip). The numbers are rounded integers, and `ascent`/`descent` may be empty. `<path>` is the geometry as polyline-style deltas at 1e-5° (about 1 m) in the URL-safe base64 alphabet, roughly 3 characters per point. A link therefore opens on any device or browser without needing the sender's history. An invalid or truncated URL redirects to Home.

Regenerating replaces the matching history entry (or adds one if the link was not in history) and updates the URL. Very long routes produce long URLs, so servers or chat apps with tight URL limits may truncate them.

## State Model

State lives in `src/store/useStore.ts`.

Persisted fields:

- `heightCm`
- `routeType`
- `steps`
- `history`
- `themePreference`
- `language`
- `avoidHighways`
- `preferGreen`
- `isTracking`
- `liveStepsSnapshot`

Session-only fields:

- `startLocation`
- `isLoading`
- `error`

History is not capped; it is stored in the browser's local storage on web (about 5 MB), so a very large history can eventually fill it. Favorites are stored as flags on history entries.

## Route Generation

The mobile app does not call the routing provider directly. It calls the route proxy URL configured in `src/config.ts`.

```txt
HomeScreen / MapScreen
  |
  v
stepService converts steps to meters
  |
  v
routeService sends route payload
  |
  v
Cloudflare Worker proxy
  |
  v
Routing provider
```

The app sends:

- start coordinates
- route type
- target steps
- stride length
- target distance
- route preferences such as avoiding highways or preferring green areas

The Worker owns provider-specific routing behavior and keeps provider secrets outside the mobile app.

## Geocoding And Location

- `locationService.ts` handles device location permission and current coordinates.
- `geocodingService.ts` handles address search through Nominatim.
- Screens use services instead of calling external APIs directly.

## Web Platform

Web support uses Metro's platform extensions: a `.web.ts(x)` file replaces its native sibling when bundling for web, and both expose the same interface.

| Module | Web implementation |
| --- | --- |
| `src/components/RouteMap.web.tsx` | Renders the route with `maplibre-gl` instead of the native MapLibre view |
| `src/services/stepCounter.web.ts` | No pedometer; live steps are estimated from GPS |
| `src/services/locationWatch.web.ts` | Location updates through `navigator.geolocation` |
| `src/services/locationPermission.web.ts` | Permission requests through the browser |
| `src/utils/showAlert.web.ts` | `window.alert`, since React Native Web's `Alert` is a no-op |

The PWA layer lives in `public/`: `index.html` (manifest link, iOS meta tags, service worker registration), `manifest.webmanifest`, `icons/`, and `sw.js`.

The service worker is network-first for the page with the cached shell as offline fallback, cache-first for hashed build files, and always uses the network for map tiles, routing and geocoding. Installing and geolocation require HTTPS, and the app must be served from the site root.

## Theming And Localization

- `src/theme.ts` resolves system/light/dark color schemes and exposes color tokens.
- `src/i18n.ts` provides English/French UI copy.
- Theme and language preferences are persisted through the Zustand store.

## Privacy And Secrets

- The mobile app contains no routing provider API key.
- Local environment files are ignored.
- Android debug keystores are ignored and are not tracked.
- The public repository excludes the Cloudflare Worker source because it contains deployment-specific routing infrastructure.

