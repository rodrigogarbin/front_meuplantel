# Laravel Backend Agent Memory

## Schema Conventions (confirmed)

- `usuario` table, PK `usuario_id` (User model)
- `passaro` table, PK `passaro_id`
- `postura` table, PK `postura_id`
- `gaiola` table, PK `gaiola_id`
- `especie` table, PK `especie_usuario_id`
- All models: `public $timestamps = false` EXCEPT standard Laravel ones (e.g., PushSubscription uses timestamps)
- FK pattern: `usuario_id` everywhere for user scoping

## Auth Pattern

- JWT via `auth:api` guard (Tymon JWT-Auth v2)
- `$request->user()->usuario_id` to get the authenticated user's PK
- Middleware applied in constructor: `$this->middleware('auth:api')->except('publicMethod')`

## Route File Pattern

- All versioned routes live inside `Route::prefix('v1')->group(...)` in `routes/api.php`
- Import alias pattern: `use App\Http\Controllers\v1\FooController as V1FooController;`
- Public routes placed directly; auth routes wrapped in `Route::middleware('auth:api')->group(...)`

## SQLite FK Workaround

- SQLite in local/test does not enforce FKs by default
- Wrap `$table->foreign(...)` in a `try/catch(\Throwable)` block in migrations to avoid test failures
- Add an index separately as fallback for query performance

## PlantelAlertasService Signature

- `buscarDescascando(int $userId, int $dias): array`
- `buscarAnilhar(int $userId, int $dias): array`
- `buscarSeparar(int $userId, int $dias): array`
- Returns `['total', 'atrasados', 'truncado', 'itens']`
- Pass `$dias=1` for "today only" alerts in push notifications

## Swagger

- Tag/annotation at class level with `@OA\Tag`
- All endpoints need `@OA\` annotations; run `php artisan l5-swagger:generate` after changes
- Security: `security={{"bearerAuth":{}}}` for authenticated endpoints

## Web Push (added 2026-04-24)

- Package: `minishlink/web-push`
- VAPID keys stored in `.env`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Config entry: `config('services.vapid.public_key')` etc.
- Model: `PushSubscription` — table `push_subscriptions`, timestamps ON, scoped by `usuario_id`
- Service: `PushNotificationService` — `sendToUser()` + `sendAlertasToAllUsers()`
- Scheduler: daily at 07:00 in `app/Console/Kernel.php`
- Generate keys: `php artisan tinker --execute="echo json_encode(Minishlink\WebPush\VAPID::createVapidKeys());"`
- Subscription content encoding: `aesgcm`
- On HTTP 410/404 from push endpoint: delete that subscription from DB
