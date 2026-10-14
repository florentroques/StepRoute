# Development Notes

## Requirements

- Node.js 20+
- pnpm
- Expo tooling
- Android Studio / Android SDK for Android builds

## Commands

```bash
pnpm install
pnpm start
pnpm android
pnpm ios
pnpm exec tsc --noEmit
```

No test runner is currently configured. TypeScript validation is the main automated check.

## Web / PWA

```bash
pnpm web                  # expo start --web, served on http://localhost:8081
npx expo export -p web    # static build in dist/
```

- Preview the export with any static server (for example `npx serve dist`) to test the service worker; the dev server registers it too but has no hashed files to cache.
- Installing the app and geolocation need HTTPS; `localhost` counts as secure.
- First visit cannot work offline: the worker caches the bundle from the second load. Bump `VERSION` in `public/sw.js` to drop old caches.
- Deploy `dist/` from the site root on any static host. Cloudflare Pages is one example: build command `npx expo export -p web`, output directory `dist`.
- Routes are shared as `/route/<encoded route>` URLs; the format is documented in `docs/ARCHITECTURE.md` and implemented in `src/navigation/routeCodec.ts`. Reload on any path works because the host serves `index.html` for unknown paths (Cloudflare Pages does by default).
- Native alerts are not available through React Native Web, so `src/utils/showAlert.web.ts` uses `window.alert`.

## Formatting And Linting

- ESLint uses the flat config in `eslint.config.js`.
- Prettier uses `.prettierrc`.
- Style defaults: single quotes, semicolons, 2-space indentation, 90-character print width.

## Configuration

The route API URL is read from Expo config:

```ts
Constants.expoConfig?.extra?.routeApiUrl
```

If no value is provided, `src/config.ts` falls back to the public route proxy URL.

## Public Repository Notes

- Do not commit `.env` files.
- Do not commit Android signing keys or debug keystores.
- Keep provider credentials inside deployment infrastructure, not the mobile app.
- Keep generated build output out of Git.

