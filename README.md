# frontend

## What Code Do

TUI-style single-page application (SPA) for the FCI cloud platform.

Users log in with OIDC (Authentik). After login, they see a terminal-aesthetic dashboard to:

- Create, view, delete **Compute Engines** — start/stop instances, open terminal sessions, view CPU/memory/disk metrics.
- Create, view, delete **Databases** — Postgres clusters, connection strings, SQL editor, CSV/JSON data import, time-series metrics.
- Manage **Storage buckets** — create, configure firewall rules, view metrics.
- Manage **IAM users** — create/delete users, view activity log.
- Manage **Networks** — create VPCs, view network map.
- View **Account settings** — profile, API keys, theme, session preferences.

Two modes:

- **`nonprod`**: MSW (Mock Service Worker) intercepts all API calls and returns fake data. No backend needed. Used for development.
- **`prod`**: Real API calls go to `api-gateway`. OIDC required. Terminal uses real WebSocket.

## Why Need It

Browser interface for the platform. No other way for users to interact with their cloud resources without a CLI or raw API calls.

TUI aesthetic keeps it fast and accessible without heavy UI framework overhead.

## How Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env
cp .env.example .env
# Default .env already works for local dev (VITE_APP_ENV=nonprod, MSW mock data)

# 3. Start dev server with mock data (no backend needed)
npm run dev
# Open http://localhost:5173

# 4. Run tests
npm test

# 5. Build for production
npm run build
# Output: dist/

# 6. Preview built output
npm run preview
```

To run with a real backend (instead of mock data):
```bash
VITE_APP_ENV=prod \
VITE_API_BASE_URL=https://api.example.com \
VITE_OIDC_AUTHORITY=https://auth.example.com/application/o/fci/ \
VITE_OIDC_CLIENT_ID=your-client-id \
npm run dev
```

To enable real terminal WebSocket:
```bash
VITE_ENABLE_REAL_TERMINAL=true \
VITE_WS_BASE_URL=ws://localhost:8080 \
npm run dev
```

## Language

TypeScript 6. React 19. Vite 8. No server-side code. Pure browser SPA.

## Folders

```
src/
  app/            Router setup, provider wiring, UiPreview dev page.
  components/     Shared UI pieces (auth guards, terminal, SQL editor, generic UI).
    auth/         OIDC token sync, ProtectedRoute guard.
    database/     Data import panel, query result panel.
    editor/       Monaco SQL editor component.
    terminal/     xterm.js terminal component.
    ui/           Button, Modal, Panel, Badge, Toast, ThemeSwitcher, etc.
  features/       One folder per platform service.
    account/      Account profile API + hooks.
    computeEngine/ VM instances: API, hooks, store, pages, terminal tab.
    dashboard/    Main layout: TopBar, DataTable, DetailPanel, modals, global search.
    database/     Database clusters: API, hooks, store, pages, SQL editor, import sections.
    iam/          IAM users: API, hooks, store, pages.
    kubernetes/   Coming-soon settings page.
    loadBalancer/ Coming-soon settings page.
    network/      VPCs: API, hooks, store, pages.
    storage/      Buckets: API, hooks, store, pages.
  hooks/          App-wide hooks (useSmartBack, useIsMobile).
  lib/            Core utilities: axios client, error helpers, OIDC config, WebSocket, queryFactory, theme, format.
  mocks/          MSW browser worker, handlers, seeded fake data.
  pages/          Top-level page components (Login, Dashboard, Account, About, 404, Standalone Console).
  store/          Zustand global stores (theme, toast, region).
  styles/         Global CSS (TUI variables, layout primitives).
  test/           Vitest setup, server config, handler isolation tests.
  utils/          File parser, file validator (for CSV/JSON import).
public/
  config.js       Runtime config entry point. Kubernetes mounts real values over this file.
  mockServiceWorker.js  MSW service worker script (generated).
  theme-init.js   Sets data-theme before first paint (prevents flash).
  icons.svg       Sprite sheet for all icons.
nginx.conf        Production container nginx config.
Dockerfile        Multi-stage build: npm build → nginx:alpine image.
```

## Read More

- [ARCHITECTURE.md](ARCHITECTURE.md) — component tree, data flow, auth model, runtime config, MSW mock system, theme engine
- [API.md](API.md) — backend API calls the SPA makes, WebSocket protocol, runtime config contract, error handling
- [FILES.md](FILES.md) — every file, one line
