# PWA Offline-First com Sync Multi-Dispositivo

## Diagnóstico da Situação Atual

| Aspecto | Estado Atual | Gap |
|---|---|---|
| Leitura offline | Workbox NetworkFirst (5min cache, 50 entradas) | Cache expira rápido, sem persistência entre sessões |
| Escrita offline | Nenhuma | Mutations falham silenciosamente |
| Persistência do cache | Apenas memória (gcTime 30min) | App fechado = cache perdido |
| Multi-dispositivo | Nenhum controle | Sobrescrita cega |
| Fila de sync | Inexistente | — |

---

## Arquitetura Proposta

```
┌──────────────────────────────────────────────────────────────┐
│                        PWA (Browser)                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                     React App                            │ │
│  │                                                          │ │
│  │  TanStack Query (in-memory)  ←→  IndexedDB (Dexie.js)  │ │
│  │  ─ staleTime / gcTime              ─ query cache persist │ │
│  │  ─ optimistic updates              ─ sync queue          │ │
│  │  ─ invalidation após sync          ─ offline data        │ │
│  │                                                          │ │
│  │  SyncEngine                                              │ │
│  │  ─ processa fila na ordem certa                          │ │
│  │  ─ resolve IDs temporários                               │ │
│  │  ─ detecta e reporta conflitos                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Service Worker (Workbox)               │ │
│  │  ─ Pre-cache de assets estáticos                         │ │
│  │  ─ NetworkFirst API (24h, 200 entradas)                  │ │
│  │  ─ CacheFirst para imagens/fontes                        │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              ↕ sync
┌──────────────────────────────────────────────────────────────┐
│                     Laravel API                               │
│  ─ X-Idempotency-Key (deduplicação)                          │
│  ─ updated_at para detecção de conflitos                      │
│  ─ Resposta 409 Conflict se dado foi modificado              │
└──────────────────────────────────────────────────────────────┘
```

---

## Desafios Críticos e Soluções

### 1. IDs Temporários em Cadeia

O problema mais complexo: criar dados offline gera IDs temporários que outras criações podem referenciar.

```
Usuário cria Pássaro offline    → ID temporário: "tmp_abc123"
Usuário cria Casal com esse pássaro → macho_id: "tmp_abc123"
Usuário cria Postura do casal   → casal_id: "tmp_xyz789"

Durante o sync:
  1. POST /passaros              → servidor retorna id: 456
  2. Mapeia: tmp_abc123 → 456
  3. POST /casais {macho_id: 456} → servidor retorna id: 99
  4. Mapeia: tmp_xyz789 → 99
  5. POST /casais/99/posturas   → sucesso
```

**Solução:** `tempIdMap: Map<string, number>` mantido durante o sync, com campo `dependsOn` na fila.

### 2. Conflitos Multi-Dispositivo

```
Dispositivo A (offline): altera Pássaro 123 { cor: "verde" }
Dispositivo B (offline): altera Pássaro 123 { cor: "azul" }

Dispositivo A sincroniza primeiro → servidor: { cor: "verde", updated_at: T1 }
Dispositivo B tenta sincronizar:  → envia baseUpdatedAt: T0
                                  → servidor detecta: T1 > T0 → 409 Conflict
```

**Solução:** Frontend armazena `baseUpdatedAt` (timestamp da última leitura). Backend valida com `If-Unmodified-Since`. Em conflito, retorna 409 e frontend exibe resolução ao usuário.

### 3. Ordem de Processamento

```
Ordem de criação:  Pássaros → Casais → Posturas
Ordem de exclusão: Posturas → Casais (encerrar antes de deletar)
Updates/Patches:   Qualquer ordem
```

---

## Fases de Implementação

### Fase 1 — Leitura Offline Persistente

**Objetivo:** Usuário vê seus dados (pássaros, casais, posturas) offline após a primeira visita.

**Pacotes a instalar:**
```bash
pnpm add dexie idb-keyval @tanstack/react-query-persist-client
```

**Arquivos criados/modificados:**

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/lib/db.ts` | Criar | Schema Dexie.js (IndexedDB) |
| `src/lib/queryClient.ts` | Modificar | Adicionar persister para IndexedDB |
| `vite.config.ts` | Modificar | API cache: 5min → 24h, 50 → 200 entradas |
| `src/hooks/useOnlineStatus.ts` | Criar | Hook de status de rede |
| `src/components/ui/OfflineBanner.tsx` | Criar | Banner offline no topo |
| `src/app/layouts/MainLayout.tsx` | Modificar | Incluir OfflineBanner |

**Schema do banco (`db.ts`):**
```typescript
class AppDatabase extends Dexie {
  queryCache!: Table<{ key: string; data: any; updatedAt: number }>
  syncQueue!: Table<SyncOperation>
  tempIdMap!: Table<{ tempId: string; realId: number; entity: string }>
}

db.version(1).stores({
  queryCache: 'key, updatedAt',
  syncQueue:  '++id, status, entity, createdAt, dependsOn',
  tempIdMap:  'tempId, entity',
})
```

**TanStack Query Persister:**
```typescript
const idbPersister = experimental_createPersister({
  storage: createIDBStorage(), // wrapper sobre db.queryCache
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
  buster: import.meta.env.VITE_APP_VERSION, // invalida no deploy
})

// Aplicar por query que deve ser persistida:
usePassaros({ ..., persister: idbPersister })
```

**Workbox (`vite.config.ts`):**
```typescript
{
  urlPattern: /\/api\/v1\/(passaros|casais|posturas|especies)/,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'api-data-cache',
    networkTimeoutSeconds: 5,   // Cai para cache mais rápido
    expiration: {
      maxEntries: 200,           // era 50
      maxAgeSeconds: 86400       // era 300 (5min) → 24h
    }
  }
}
```

---

### Fase 2 — Fila de Mutações Offline

**Objetivo:** Criar/editar/excluir pássaros, casais e posturas offline; alterações ficam em fila.

**Arquivos criados/modificados:**

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/features/sync/types.ts` | Criar | Tipos da fila de sync |
| `src/store/syncStore.ts` | Criar | Estado global da fila (Zustand) |
| `src/lib/offlineMutation.ts` | Criar | Wrapper de mutation com detecção offline |
| `src/features/passaros/passarosApi.ts` | Modificar | Wrap em useCreatePassaro, useUpdatePassaro, useDeletePassaro |
| `src/features/casais/casaisApi.ts` | Modificar | Wrap em useCreateCasal, useUpdateCasal, useEncerrarCasal |
| `src/features/posturas/posturasApi.ts` | Modificar | Wrap nas mutations de posturas |

**Tipo `SyncOperation`:**
```typescript
interface SyncOperation {
  id: string                         // UUID v4 (idempotency key)
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'PATCH'
  entity: 'passaro' | 'casal' | 'postura'
  entityId: string | number          // server ID ou temp ID (ex: "tmp_abc123")
  isTempId: boolean
  payload: Record<string, any>
  baseUpdatedAt?: string             // Para detecção de conflito
  status: 'pending' | 'processing' | 'done' | 'failed' | 'conflict'
  retryCount: number
  maxRetries: number                 // default: 3
  createdAt: string
  error?: string
  dependsOn?: string[]              // IDs de ops que devem completar antes
  optimisticData?: Record<string, any> // Para update otimista
}
```

**Lógica do wrapper `offlineMutation`:**
```
Se online: executa normalmente (comportamento atual)
Se offline:
  1. Gera ID temporário para CREATEs
  2. Atualiza TanStack Query cache otimisticamente
  3. Persiste no IndexedDB (syncQueue)
  4. Atualiza syncStore.pendingCount++
  5. Retorna dados otimistas para o usuário não perceber
```

---

### Fase 3 — Motor de Sincronização

**Objetivo:** Processar a fila corretamente ao reconectar, resolver IDs temporários, detectar conflitos.

**Arquivos criados:**

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/lib/syncEngine.ts` | Criar | Orquestrador principal |
| `src/features/sync/operations/passarosSync.ts` | Criar | Handler de sync para pássaros |
| `src/features/sync/operations/casaisSync.ts` | Criar | Handler de sync para casais |
| `src/features/sync/operations/posturasSync.ts` | Criar | Handler de sync para posturas |

**Algoritmo do `SyncEngine`:**
```
SyncEngine.start():
  1. Verifica token JWT (refresh se necessário)
  2. Carrega fila do IndexedDB (status: 'pending')
  3. Ordena: CREATEs por dependsOn → UPDATEs → DELETEs
  4. Para cada operação:
     a. Resolve IDs temporários (substitui pelo real via tempIdMap)
     b. Envia para API com header X-Idempotency-Key: operation.id
     c. Se 201/200:
        - Para CREATE: armazena tempId → realId no tempIdMap
        - Marca op como 'done'
        - Invalida queries afetadas no TanStack Query
     d. Se 409 Conflict:
        - Marca op como 'conflict'
        - Emite evento para UI mostrar resolução
     e. Se 5xx ou network error:
        - Incrementa retryCount
        - Se retryCount < maxRetries: mantém 'pending'
        - Senão: marca 'failed'
  5. Após fila processada: refetch de todas as queries afetadas
  6. Limpa tempIdMap e entradas 'done' antigas
```

**Triggering:**
```typescript
// useOnlineStatus.ts — ao voltar online
window.addEventListener('online', () => {
  syncEngine.start()
})

// Também ao abrir o app (pode ter ficado offline enquanto fechado)
// E a cada 30s se há itens na fila e online
```

---

### Fase 4 — UX e Indicadores

**Objetivo:** Usuário entende claramente o que está acontecendo.

**Arquivos criados/modificados:**

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/components/ui/OfflineBanner.tsx` | Criar | Banner vermelho/amarelo no topo |
| `src/components/ui/SyncStatus.tsx` | Criar | Indicador de sync em progresso |
| `src/components/ui/ConflictResolver.tsx` | Criar | Modal de resolução de conflito |
| `src/app/layouts/MainLayout.tsx` | Modificar | Integrar todos os indicadores |

**Estados visuais:**
```
🔴 Offline — sem conexão
   Banner: "Sem internet · X alterações pendentes"

🟡 Sincronizando
   Badge animado na topbar: "Sincronizando 3/7..."

🟢 Sincronizado
   Toast: "Tudo sincronizado ✓" (desaparece em 3s)

⚠️  Conflito detectado
   Modal: "Este [pássaro/casal] foi alterado em outro dispositivo.
           Manter sua versão | Usar versão do servidor"

❌ Falha após 3 tentativas
   Toast persistente: "3 alterações não puderam ser sincronizadas. Tentar novamente"
```

---

### Fase 5 — Backend Laravel (Idempotência e Conflitos)

**Objetivo:** Prevenir duplicatas em retry e detectar conflitos multi-dispositivo.

**Arquivos criados/modificados:**

| Arquivo | Ação | Descrição |
|---|---|---|
| `database/migrations/…_create_idempotency_keys_table.php` | Criar | Tabela de idempotência |
| `app/Http/Middleware/IdempotencyMiddleware.php` | Criar | Verifica/armazena chaves |
| `app/Http/Kernel.php` | Modificar | Registrar middleware |
| `routes/api.php` | Modificar | Aplicar middleware nos POSTs |

**Schema `idempotency_keys`:**
```sql
CREATE TABLE idempotency_keys (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  usuario_id    BIGINT NOT NULL,
  key           VARCHAR(36) NOT NULL,  -- UUID do frontend
  response_code SMALLINT NOT NULL,
  response_body JSON NOT NULL,
  expires_at    TIMESTAMP NOT NULL,    -- now + 24h
  UNIQUE KEY (usuario_id, key)
);
```

**Fluxo do middleware:**
```
Request chega com X-Idempotency-Key: "uuid-abc"
  → Busca na tabela (usuario_id + key)
  → Se existe e não expirou: retorna resposta cacheada (sem executar)
  → Se não existe: executa, armazena resposta, retorna
```

**Detecção de conflito:**
```php
// Em PUT /passaros/{id}
// Frontend envia header: X-Base-Updated-At: "2026-02-19T10:00:00Z"

$baseUpdatedAt = $request->header('X-Base-Updated-At');
if ($baseUpdatedAt && $passaro->updated_at > $baseUpdatedAt) {
    return response()->json([
        'message' => 'Conflito detectado',
        'server_data' => $passaro,
    ], 409);
}
```

---

## Pontos de Atenção / Riscos

| Risco | Mitigação |
|---|---|
| Token JWT expirado durante offline | Verificar expiração e forçar refresh antes de iniciar sync |
| Usuário deleta dado que outro dispositivo está editando | Sync retorna 404, marca como failed, notifica usuário |
| IndexedDB cheio | Limpar entradas done com > 7 dias; monitorar quota com `navigator.storage.estimate()` |
| Conflito em genealogia (pássaro com pais alterados em 2 dispositivos) | Última escrita vence (LWW) — aceitável para essa aplicação |
| Fotos (upload) | Manter na fila com dado binário em IndexedDB — monitorar tamanho; limite de ~50MB por upload |
| Primeira instalação | Pré-carregar todos os dados críticos no onSuccess do login |

---

## O que NÃO muda

- Estrutura das páginas React
- Hooks de queries existentes (apenas acrescenta persistência)
- Contrato da API (adiciona headers opcionais)
- Autenticação JWT (comportamento idêntico)
- Todas as 246 testes do backend continuam passando

---

## Plano de Execução

### Semana 1 — Fase 1: Leitura Offline Persistente + Banner

**Objetivo:** Usuário consegue navegar offline após primeira visita. Baixo risco, alto valor imediato.

#### Dia 1-2: Infraestrutura IndexedDB
- [ ] Instalar dependências: `pnpm add dexie idb-keyval @tanstack/react-query-persist-client`
- [ ] Criar `src/lib/db.ts` com schema Dexie (tabelas: queryCache, syncQueue, tempIdMap)
- [ ] Criar wrapper `createIDBStorage()` compatível com interface do persister

#### Dia 3: TanStack Query Persister
- [ ] Modificar `src/lib/queryClient.ts` para configurar persister
- [ ] Aplicar `persister` nas queries críticas: passaros, casais, posturas, especies
- [ ] Testar: fechar app, abrir offline, verificar dados carregam do IndexedDB

#### Dia 4: Workbox — Cache mais agressivo
- [ ] Modificar `vite.config.ts`: aumentar cache API para 24h e 200 entradas
- [ ] Adicionar `networkTimeoutSeconds: 5` para fallback mais rápido
- [ ] Build e validar no DevTools → Application → Cache Storage

#### Dia 5: Status de rede + Banner
- [ ] Criar `src/hooks/useOnlineStatus.ts` (ouve eventos `online`/`offline`)
- [ ] Criar `src/components/ui/OfflineBanner.tsx` (banner vermelho no topo)
- [ ] Integrar no `src/app/layouts/MainLayout.tsx`
- [ ] Testar em modo offline do Chrome DevTools

**Critério de aceite:** Navegar no app sem internet e ver os dados que foram carregados online anteriormente.

---

### Semana 2 — Fase 2: Fila de Mutações Offline

**Objetivo:** Criar/editar/excluir funciona offline; alterações são enfileiradas.

#### Dia 1: Tipos e Store
- [ ] Criar `src/features/sync/types.ts` com `SyncOperation` e enums
- [ ] Criar `src/store/syncStore.ts` (Zustand): estado da fila, `pendingCount`, `isSyncing`

#### Dia 2-3: Wrapper de Mutação Offline
- [ ] Criar `src/lib/offlineMutation.ts`:
  - Detecta `navigator.onLine`
  - Se online: passa para mutation original
  - Se offline: gera tempId, atualiza cache otimisticamente, persiste na fila IndexedDB
- [ ] Testar wrapper isolado com mock de operações

#### Dia 4-5: Integrar nas APIs existentes
- [ ] Modificar `passarosApi.ts`: wrap em `useCreatePassaro`, `useUpdatePassaro`, `useDeletePassaro`
- [ ] Modificar `casaisApi.ts`: wrap em `useCreateCasal`, `useUpdateCasal`, `useEncerrarCasal`
- [ ] Modificar `posturasApi.ts`: wrap nas mutations principais
- [ ] Testar fluxo completo: criar pássaro offline → verificar fila no IndexedDB

**Critério de aceite:** Criar um pássaro offline → item aparece na lista (otimístico) → ver entrada na tabela `syncQueue` no IndexedDB.

---

### Semana 3 — Fase 3: Motor de Sincronização

**Objetivo:** Fila é processada corretamente ao reconectar. IDs temporários resolvidos.

#### Dia 1-2: SyncEngine — esqueleto e ordenação
- [ ] Criar `src/lib/syncEngine.ts` com classe `SyncEngine`
- [ ] Implementar carregamento da fila e ordenação (CREATEs → UPDATEs → DELETEs)
- [ ] Implementar resolução de `dependsOn` para IDs temporários

#### Dia 3: Handlers por entidade
- [ ] Criar `src/features/sync/operations/passarosSync.ts`
- [ ] Criar `src/features/sync/operations/casaisSync.ts`
- [ ] Criar `src/features/sync/operations/posturasSync.ts`
- [ ] Cada handler: executa chamada API, mapeia tempId → realId, invalida queries

#### Dia 4: Triggering e retry
- [ ] Integrar `SyncEngine.start()` no hook `useOnlineStatus`
- [ ] Adicionar retry com backoff (3 tentativas)
- [ ] Implementar limpeza de entradas `done` antigas

#### Dia 5: Testes de integração offline
- [ ] Cenário: criar pássaro + casal offline → reconectar → verificar sync completo
- [ ] Cenário: editar mesmo registro em dois "dispositivos" (abas diferentes) → verificar comportamento
- [ ] Verificar que TanStack Query invalida e refetch após sync

**Critério de aceite:** Criar pássaro + casal offline, fechar aba, reconectar, abrir app → dados sincronizados sem duplicatas.

---

### Semana 4 — Fase 4 (UX completa) + Fase 5 (Backend)

**Objetivo:** UX polida para conflitos e falhas + backend à prova de retry.

#### Dia 1-2: Backend — Idempotência
- [ ] Criar migration `create_idempotency_keys_table`
- [ ] Criar `IdempotencyMiddleware.php`
- [ ] Registrar middleware em `Kernel.php` para rotas POST/PUT/DELETE
- [ ] Executar testes: `php artisan test` → garantir 100% passando

#### Dia 3: Backend — Detecção de conflito
- [ ] Adicionar validação de `X-Base-Updated-At` nos controllers de passaro, casal, postura
- [ ] Retornar 409 com `server_data` quando conflito detectado
- [ ] Adicionar testes para cenário de conflito

#### Dia 4: UI de conflito e sync status
- [ ] Criar `src/components/ui/SyncStatus.tsx` (badge animado na topbar)
- [ ] Criar `src/components/ui/ConflictResolver.tsx` (modal com duas opções)
- [ ] Integrar com `syncStore` para mostrar estado correto

#### Dia 5: Testes de ponta a ponta + ajustes
- [ ] Testar fluxo completo: offline → sync → conflito → resolução
- [ ] Testar com quota do IndexedDB (`navigator.storage.estimate()`)
- [ ] Ajustes finais de UX e tratamento de edge cases

**Critério de aceite:** Modificar mesmo pássaro em dois dispositivos offline → ao sincronizar, modal de conflito aparece → usuário escolhe versão → app reflete a escolha corretamente.

---

### Resumo de Arquivos por Fase

```
Fase 1 (Leitura Offline):
  + src/lib/db.ts
  ~ src/lib/queryClient.ts
  ~ vite.config.ts
  + src/hooks/useOnlineStatus.ts
  + src/components/ui/OfflineBanner.tsx
  ~ src/app/layouts/MainLayout.tsx

Fase 2 (Fila de Mutações):
  + src/features/sync/types.ts
  + src/store/syncStore.ts
  + src/lib/offlineMutation.ts
  ~ src/features/passaros/passarosApi.ts
  ~ src/features/casais/casaisApi.ts
  ~ src/features/posturas/posturasApi.ts

Fase 3 (Motor de Sync):
  + src/lib/syncEngine.ts
  + src/features/sync/operations/passarosSync.ts
  + src/features/sync/operations/casaisSync.ts
  + src/features/sync/operations/posturasSync.ts

Fase 4 (UX):
  + src/components/ui/SyncStatus.tsx
  + src/components/ui/ConflictResolver.tsx
  ~ src/app/layouts/MainLayout.tsx

Fase 5 (Backend):
  + database/migrations/…_create_idempotency_keys_table.php
  + app/Http/Middleware/IdempotencyMiddleware.php
  ~ app/Http/Kernel.php
  ~ routes/api.php
  ~ app/Http/Controllers/v1/PassaroController.php
  ~ app/Http/Controllers/v1/CasalController.php
  ~ app/Http/Controllers/v1/PosturaController.php

Legenda: + criar  ~ modificar
```

### Métricas de Sucesso

| Métrica | Meta |
|---|---|
| Dados visíveis offline | 100% das listas principais (pássaros, casais, posturas) |
| Mutações offline | CREATE, UPDATE, DELETE para as 3 entidades principais |
| Taxa de sync bem-sucedido | >95% das operações sem intervenção manual |
| Tempo de sync ao reconectar | <5s para fila de até 20 operações |
| Testes backend | 246/246 passando (sem regressões) |
| Detecção de conflito | 100% dos casos multi-dispositivo detectados |
