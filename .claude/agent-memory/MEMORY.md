# MeuPlantel Frontend — Agent Memory

## Key Files and Locations

- Shared postura alert logic: `src/lib/posturaAlerts.ts` — `calcPosturaAlerts()` + `getDiasConfig()`
- Postura status labels (canonical): `src/types/index.ts` — `SitPosturaLabels`, `SitPosturaColors`
- Axios client: `src/lib/api.ts`
- Theme utilities: `src/lib/theme.ts`
- Filter store: `src/lib/filtersStore.ts`

## SitPostura Labels (canonical, as of last refactor)

- 0 CHOCO = "Chocando" (was "Choco" — updated)
- 1 NASCIDO = "Nascido"
- 2 BRANCO = "Branco/Infértil"
- 3 EMBRIAO_MORTO = "Embrião Morto"
- 4 FILHOTE_MORTO = "Filhote Morto"
- 5 FERTIL = "Fértil"

## Alert Calculation Pattern (posturaAlerts.ts)

`calcPosturaAlerts(input: PosturaAlertInput, config: PosturaDiasConfig): PosturaAlertResult`

- AlertType: 'nascendo' | 'proximo' | 'anilhar' | 'separar' | 'verificar'
- 'verificar' appended when any primary alert is >30 days overdue
- 'proximo' = 1–3 days until hatch (NOT shown as an alert badge in PosturasPage — only in CasalCard)
- Consumers map AlertType to display strings with emojis themselves

`getDiasConfig(casal?)` resolves dias with priority: casal direct > macho.especie > femea.especie

## Consumers of calcPosturaAlerts

- `posturasApi.ts` — `getPosturaAlertsSimple()` (for usePosturasPendentes hook)
- `PosturasPage.tsx` — `getPosturaAlerts()` (maps to emoji strings for AlertBadge)
- `CasalCard.tsx` — inline loop replaced, derives `hasNascendo/hasProximo/hasAnilhar/hasSeparar`
- `CasalDetailsSheet.tsx` — `PosturaOvoChip` and `PosturaRecebidaChip` (maps to 'Anilhar filhote'/'Separar filhote' strings)

## CasalDetailsSheet — PosturaOvoChip / PosturaRecebidaChip Pattern

These chips no longer declare `isNascido` (unused after refactor). They DO still use:
- `isChocando` — for conditional render branches
- `isFertil` — for the "Fértil" badge inside the chocando branch
- `alerts` string[] — mapped from AlertType for render

## SitPosturaColors export

Added to `src/types/index.ts` — Tailwind class strings per sit value, available for future use.

## qrcode.react — Custom Type Declaration Override

`src/types/qrcode.react.d.ts` is an ambient module declaration that OVERRIDES the package's own types.
It only declared `QRCodeSVG` originally — `QRCodeCanvas` had to be added manually.
Any new exports from qrcode.react must also be added to this file.
The package is v4.2.0 (not 4.1.0 as some docs may say).

## Certificado Genealógico Feature

- Certificate creation endpoint: `POST /api/v1/certificados` → `{ token: string }`
- Verification endpoint: `GET /api/v1/certificados/{token}/verificar` → `CertificadoData`
- Public verification page: `src/features/certificado/CertificadoVerificacaoPage.tsx`
- Registered as public route `/verificar/:token` (no PrivateRoute wrapper) in `src/app/router.tsx`
- QR code embedded in PDF header using `QRCodeCanvas` from qrcode.react, read via `canvas.toDataURL()`

## Build Command

`pnpm run build` from `frontend/` directory. TypeScript strict mode — no `any`.
Pre-existing: PWA workbox fails when main chunk exceeds 2MB (bundle size issue, not a TS error).

## Conventions

- AlertType enum values are lowercase ('nascendo', not 'NASCENDO')
- Date parsing always uses `new Date(dateStr + 'T00:00:00')` to avoid timezone shifts
- `diasRestantes` in PosturaAlertResult is negative when overdue (hatch date in the past)
