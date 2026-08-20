# ARCHITECTURE — How Code Work Together

## Big Picture

```
  Browser
  ┌─────────────────────────────────────────────────┐
  │  /config.js (injected by Kubernetes)            │
  │  └── window.__FCI_CONFIG__                      │
  │       ├── apiBaseUrl                            │
  │       ├── oidcAuthority / oidcClientId          │
  │       ├── enableRealTerminal                    │
  │       └── wsBaseUrl                             │
  │                                                 │
  │  React SPA                                      │
  │  ├── AuthProvider (OIDC)                        │
  │  │   └── AuthTokenSync → axios token            │
  │  ├── QueryClientProvider (TanStack Query)       │
  │  ├── Router (React Router v7)                   │
  │  │   ├── /login, /callback                      │
  │  │   ├── /dashboard  (ProtectedRoute)           │
  │  │   ├── /services/:serviceId/:tab              │
  │  │   ├── /services/compute-engine/instances/:id │
  │  │   ├── /account                               │
  │  │   └── /console/:computeEngineName            │
  │  └── ToastContainer (global notifications)      │
  │                                                 │
  │  nonprod mode only:                             │
  │  └── MSW Service Worker (intercepts /api/*)     │
  └─────────────────────────────────────────────────┘
       │ HTTP (axios)           │ WebSocket
       ▼                        ▼
  api-gateway             terminal-gateway
  (backend API)           /ws/terminal/:id
```

### Startup Sequence

1. `public/theme-init.js` sets `data-theme` on `<html>` before React mounts — no theme flash.
2. `public/config.js` sets `window.__FCI_CONFIG__`. In production, Kubernetes ConfigMap mounts real values over this file. On localhost, sets `appEnv: 'nonprod'`.
3. `src/main.tsx` renders `<AppProviders>` + `<RouterProvider>`.
4. `AppProviders` wraps children with `QueryClientProvider` and (when OIDC configured) `AuthProvider`.
5. `AuthTokenSync` component inside `AuthProvider` watches OIDC session and calls `setAuthToken()` on `lib/axios.ts` whenever token changes.
6. In `nonprod` mode, MSW service worker starts and intercepts all `/api/*` requests with fake in-memory data.
7. `ProtectedRoute` checks OIDC auth state. If not authenticated, redirects to OIDC provider. If OIDC not configured, passes through.

## What Part Do

### `lib/runtimeConfig`
Reads `window.__FCI_CONFIG__` merged with Vite build-time env vars. Single source of truth for all config. In prod, all OIDC and API URLs MUST use HTTPS. `assertValidProductionConfig()` throws on boot if any prod URL is invalid.

### `lib/axios`
Single shared `axios` instance. Base URL from `runtimeConfig.apiBaseUrl`. Request interceptor attaches `Authorization: Bearer <token>`. Response interceptor: on 401, clears token and fires `fci:auth-unauthorized` DOM event. On `FormData` upload, removes `Content-Type` so axios sets multipart boundary correctly.

### `lib/oidc`
Builds OIDC config object for `react-oidc-context`. Requires `scope: openid profile email offline_access` — the `offline_access` scope gets a refresh token, allowing `automaticSilentRenew` without iframe (which CSP blocks).

### `lib/queryFactory`
Factory that creates standard `useList`, `useDetail`, `useCreate`, `useRemove`, `useUpdateSettings` hooks from an API config object. All five feature services (`computeEngine`, `database`, `iam`, `network`, `storage`) use this factory. Feature-specific hooks (metrics, SQL exec, import) are hand-written alongside.

### `lib/websocket`
`TerminalWebSocket` class. Manages WebSocket lifecycle for the xterm.js terminal. Features: exponential back-off reconnect (1s, 2s, 4s), max 3 retries, bounded send queue (100 messages) while connecting. `buildTerminalWsUrl(ceId)` constructs the URL from `wsBaseUrl` or falls back to same-origin (`wss://current-host`).

### `lib/apiError`
Parses backend error envelopes `{error: {code, message, request_id, details}}`. `getApiErrorMessage()` extracts human-readable text from any thrown value. `getApiErrorCode()` extracts machine-readable code.

### `features/*/api.ts`
Thin wrappers around `apiClient` (axios). One function per backend endpoint. Return typed data directly (TanStack Query handles caching).

### `features/*/hooks.ts`
`useQuery` and `useMutation` wrappers. All built with `createResourceHooks` from `queryFactory`. Mutations invalidate the list query on success so the UI refreshes automatically.

### `features/*/store.ts`
Zustand store for UI-only state (selected item ID, active tab, modal open state). Not for server data — that lives in TanStack Query cache.

### `features/dashboard`
Main shell: `TopBar`, `DataTable`, `DetailPanel`, `DashboardModal` (create forms), `CommandPalette` (keyboard shortcuts), `GlobalSearchOverlay`, `Toast`. Tabs rendered by service-specific `*TabContent.tsx` components. `DashboardOverview` is the landing screen showing all services.

### `features/computeEngine`
VM list + detail page. Terminal tab: starts `TerminalWebSocket` when `enableRealTerminal=true`, else renders mock shell. Metrics tab: line charts from Recharts.

### `features/database`
Database list + detail page. Tabs: SQL Editor (Monaco), Data Import (multipart upload), Metrics (Recharts), Backup history.

### `components/auth`
- `AuthTokenSync`: renders null, syncs OIDC token to axios.
- `ProtectedRoute`: redirects to OIDC login when not authenticated; pass-through when OIDC not configured.

### `store/themeStore`
Zustand + `persist` (localStorage). 5 themes: `default`, `beige`, `mono`, `navy`, `sketch`. Sets `data-theme` attribute on `<html>`. `theme-init.js` sets it before React hydrates to prevent flash.

### `store/toastStore`
In-memory toast queue. Components call `addToast(message, type)`. `ToastContainer` renders them. Auto-dismiss after timeout.

### `store/regionStore`
Active region (`ANK` or `IST`). Drives region filter in DataTable and TopBar `RegionSelector`.

### `mocks/`
MSW browser service worker. Handlers simulate all backend endpoints in memory. Fake data seeded in `mocks/data/`. Used only when `VITE_APP_ENV=nonprod`.

## Part Talk To Part How

```
ProtectedRoute
  └── checks useAuth() (react-oidc-context)

AuthTokenSync
  └── calls setAuthToken() on lib/axios when OIDC user changes

Feature hooks (useComputeEngines, useDatabases, ...)
  └── useQuery → feature api.ts → apiClient (axios) → api-gateway (or MSW)

Mutations (useCreate, useRemove, ...)
  └── useMutation → api.ts → axios → api-gateway
      onSuccess → queryClient.invalidateQueries (refreshes list)

Dashboard tabs
  └── receive selected item from store
      call feature hooks
      render data

TerminalView
  └── creates TerminalWebSocket
      connects to terminal-gateway /ws/terminal/:id
      pipes data ↔ xterm.js

SqlEditor (Monaco)
  └── sends SQL text to database api.ts executeSQL()
      renders result in QueryResultPanel

DataImportPanel
  └── sends multipart FormData to database api.ts importData()

themeStore
  └── reads/writes localStorage
      sets data-theme on <html>

runtimeConfig
  └── merges window.__FCI_CONFIG__ + import.meta.env
      consumed by axios, oidc, websocket
```

## Why Build This Way

| Decision | Reason |
|---|---|
| MSW mock mode (`nonprod`) | Full UI development without backend running. All 200+ tests run against same mock handlers — no test doubles needed per-test. |
| Runtime config via `/config.js` | Kubernetes can mount real OIDC URLs and API base URL over this file without rebuilding the image. Config is never baked in. |
| TanStack Query for server state | Caching, stale-time, background refetch, and mutation-invalidation in one library. No Redux needed for API data. |
| Zustand for UI state | Tiny. No boilerplate. Selected item, active tab, open modals live here — not in TanStack cache. |
| `createResourceHooks` factory | Five services have identical list/detail/create/delete patterns. Factory eliminates copy-paste. Feature-specific logic stays hand-written. |
| OIDC `offline_access` scope | Refresh tokens. Without them, `automaticSilentRenew` falls back to hidden iframes that CSP blocks. Sessions survive access-token expiry. |
| Token stored in axios module var, not React state | axios interceptors run outside React. `AuthTokenSync` bridges the OIDC session (React) to the axios module-level variable. |
| Same-origin WebSocket fallback | Production nginx proxies `/ws/` on the same host. `wsBaseUrl` can be empty; the SPA derives `wss://current-host` rather than guessing a hardcoded host. |
| Monaco for SQL editor | Full SQL syntax highlighting, autocomplete, and formatting — in the browser, no backend syntax service needed. |
| xterm.js for terminal | Industry-standard terminal emulator. Supports ANSI escape codes, resize events, binary frames — exactly what `terminal-gateway` sends. |
| 5 TUI themes | User preference. Persisted in localStorage. Applied via `data-theme` on `<html>` so all CSS variables resolve correctly. |

## Tools Used

| Tool | Why |
|---|---|
| React 19 | UI component model. |
| Vite 8 | Fast dev server, ESM-native bundler. Code-split by route via `lazy()`. |
| TypeScript 6 | Type safety across all API shapes, component props, store types. |
| React Router v7 | File-based routing with lazy route loading and error boundaries. |
| TanStack Query v5 | Server state: fetch, cache, invalidate, background refresh. |
| Zustand v5 | Client-only UI state. Minimal API, no boilerplate. |
| axios | HTTP client. Interceptors for auth token injection and 401 handling. |
| react-oidc-context | OIDC Authorization Code + PKCE flow via Authentik. Refresh token via `offline_access`. |
| MSW v2 | Mock Service Worker. Intercepts real browser fetch/XHR — no test-only stub divergence. |
| xterm.js | Terminal emulator wired to WebSocket. |
| Monaco Editor | VS Code editor engine. SQL editing with syntax highlighting. |
| Recharts | Chart library for metrics time-series. Composable React chart components. |
| Tailwind CSS v4 | Utility classes for layout. TUI aesthetic from custom CSS variables in `styles/globals.css`. |
| Vitest + Testing Library | Component tests. `vitest-axe` for accessibility checks. |
| oxlint | Fast linter. Single binary, no config sprawl. |
| nginx | Production container web server. Serves static build. Proxies `/api/` and `/ws/` to backend. |

## Code Live Where When Run

- **Dev**: Vite dev server at `http://localhost:5173`. MSW service worker handles all API calls in browser. No backend required.
- **Production**: Docker image (`nginx:alpine`). Published to `registry.freecloudinitiative.com/frontend`. Helm manifests maintained in [k3s-manifests](https://github.com/freecloudinitiative/k3s-manifests) under `applications/frontend`. Static build in `/usr/share/nginx/html`. `nginx.conf` proxies `/api/*` to `$API_BACKEND_URL` and `/ws/*` to `terminal-gateway`. Kubernetes mounts real `/config.js` values via ConfigMap.
- **Tests**: Vitest with jsdom. MSW node server intercepts fetch. No real browser, no real network.
