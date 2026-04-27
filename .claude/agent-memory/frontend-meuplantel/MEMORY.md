# Frontend Agent Memory — MeuPlantel

## Key Patterns

### tsconfig.json
- No `tsconfig.app.json` — single `tsconfig.json` at root with `include: ["src"]`
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- `sw.ts` excluded from main compilation via `exclude: ["src/sw.ts"]` (SW context conflicts with DOM lib)

### pnpm Hoisting
- pnpm uses strict hoisting — transitive workbox sub-packages (workbox-precaching, workbox-routing, etc.) are NOT available as top-level imports unless explicitly listed in package.json
- Must add workbox packages explicitly to devDependencies if using `injectManifest` strategy

### PWA / Service Worker
- Strategy: `injectManifest` (switched from `generateSW` to support custom push handling)
- SW source: `src/sw.ts` — built by vite-plugin-pwa's internal Vite instance
- `self.__WB_MANIFEST` typed via `declare global { interface ServiceWorkerGlobalScope { __WB_MANIFEST: ... } }`

### Hooks
- `/src/hooks/usePushNotifications.ts` — push notification lifecycle (permission, subscribe, unsubscribe)

### Config Feature
- `/src/features/config/NotificacoesConfig.tsx` — push notification settings card
- Added to ConfigPage between "Aparencia" and "Sobre" sections

### API Endpoints Consumed
- `GET /api/v1/push/vapid-public-key` → `{ public_key: string }`
- `POST /api/v1/push/subscribe` → `{ endpoint, public_key, auth_token, user_agent }`
- `DELETE /api/v1/push/unsubscribe` → `{ endpoint }`

## Build
- `pnpm run build` = `tsc -b && vite build`
- workbox-precaching, workbox-routing, workbox-strategies, workbox-expiration must be in devDependencies
