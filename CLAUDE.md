# Project: TUI Cloud Dashboard (Free Cloud Initiative)

A cloud-console UI (styled like AWS/GCP consoles) but with a Terminal User
Interface (TUI) aesthetic: monospace fonts, terminal color palette, bordered boxes
with floating labels. It is click-friendly (mouse + keyboard both work) but should
visually read as a terminal application, not a typical SaaS dashboard.

The whole app is a single-page dynamic dashboard (`pages/DashboardPage.tsx`): a
grid of service selector boxes, a query/search row, an items-table, and a tabbed
detail panel. Switching the active service swaps the dataset and tabs in place via
flat routing (`/services/:serviceId/:tab`).

## Verification & Testing Commands

- **Build Check**: `npm run build` (ensures strict TypeScript compilation & bundle succeeds)
- **Linting**: `npx oxlint .` (runs Oxlint across codebase)
- **Testing**: `npm test` (MSW integration tests)
- **Manual Verification Checks**:
  - TUI aesthetic & visual consistency across all 4 themes (default, beige, mono, navy)
  - Responsive layout validation (375px mobile, 768px tablet, 1440px desktop)
  - MSW network traffic verification for mock endpoints

## PR Roadmap & Development Plan

Development follows a 34-PR incremental roadmap detailed in `claude-code-pr-prompts.md`.

- **Completed**: PRs #1–#17 (Setup, Layout, Themes, VM Data Layer & Wiring, Recharts Metrics, Xterm.js Terminal, Database REST API, Live Tabs, Monaco SQL Editor, Data Import Engine, Zustand Feature Stores, Region Selection)
- **Next**: PR #18 (`feat: IAM service — data layer + MSW mock API`)

### Sprint Breakdown & PR Matrix

#### Sprint 2B — Dashboard Hardening & VM Completion

- **PR-10**: `refactor: extract TabContent into per-service components` (Completed)
- **PR-11**: `feat: wire VM items table to MSW data + row detail panel` (Completed)
- **PR-12**: `feat: VM inline actions — delete, restart, status mutations` (Completed)
- **PR-13**: `feat: VM metrics tab with Recharts + AsciiProgressBar` (Completed)
- **PR-14**: `feat: VM console tab with Xterm.js terminal (mock echo mode)` (Completed)

#### Sprint 3 — Remaining Services (Database, IAM, Network, Storage)

- **PR-15**: `feat: Database service — data layer + MSW mock API` (Completed)
- **PR-16**: `feat: Database service — wire dashboard tabs to live data` (Completed)
- **PR-17**: `feat: SQL Editor with Monaco + CSV/JSON/SQL file import engine` (Completed)
- **PR-18**: `feat: IAM service — data layer + MSW mock API`
- **PR-19**: `feat: IAM service — wire dashboard tabs to live data`
- **PR-20**: `feat: Network service — data layer + MSW mock API (nested firewall rules)`
- **PR-21**: `feat: Network service — wire dashboard tabs to live data`
- **PR-22**: `feat: Storage service — data layer + MSW mock API (buckets + files)`
- **PR-23**: `feat: Storage service — wire dashboard tabs to live data`

#### Sprint 4 — Polish, Auth, Production Readiness

- **PR-23**: `fix: consolidate dual styling system and remove dead code`
- **PR-24**: `feat: toast/notification system for mutations`
- **PR-25**: `feat: wire keyboard shortcuts from footer`
- **PR-26**: `feat: Dashboard responsive layout (mobile/tablet)`
- **PR-27**: `feat: OIDC auth integration (Authentik) and protected routes`
- **PR-28**: `feat: error boundary, 404 page, global loading skeleton`
- **PR-29**: `feat: Dashboard overview/home page with cross-service summary`
- **PR-30**: `feat: @tanstack/react-table migration for items table`
- **PR-31**: `feat: WebSocket connection layer for real terminal`
- **PR-32**: `chore: code-splitting, lazy routes, production build optimization`
- **PR-33**: `test: MSW integration tests for critical flows`
- **PR-34**: `chore: Docker build, env config, deployment readiness`

## Identified Technical Debt

1. Monolithic `DashboardPage.tsx` (~878 lines original shell)
2. Dual styling systems (`fci-`/`--dash-*` vs Tailwind/`--tui-*`)
3. `VmDetailPage` visual mismatch (`/services/vm/instances/:id` uses Tailwind primitives)
4. Hardcoded tab content (no data layer for non-VM services)
5. Dead code (`App.tsx`, stale `lib/tui-theme.ts`)
6. Unused/empty component directories (`components/layout/`, `components/terminal/`, `components/auth/`)
7. Missing UI elements: `AsciiProgressBar`, responsive layout, error boundaries, 404 page, toast/notification system
8. Decorative/unwired features: keyboard shortcuts footer hints, profile dropdown actions

## Services

VM, Database, Security, Network, IAM — each has a dataset in `lib/mockServiceData.ts`
(headers, rows, per-value status/type colors, and the field-label mapping used by the
detail panel). `features/vm` has live data via MSW; other services use static mock datasets.

## Tech stack (do not substitute libraries without asking)

- Vite + React + TypeScript (strict mode)
- Tailwind CSS for utility classes; the dashboard's exact bordered-box aesthetic
  (`pages/tui-dashboard.css`) is plain CSS, not Tailwind or CSS-in-JS — see
  "Design system" below
- react-router-dom v6 for routing
- zustand for local/UI state (`store/themeStore.ts`)
- @tanstack/react-query for all server-state (fetching/caching/mutations)
- @tanstack/react-table for all tabular data (sorting, filtering, pagination)
- axios for HTTP, wrapped in a single instance in `lib/axios.ts`
- recharts for charts (line charts for metrics)
- @xterm/xterm (+ @xterm/addon-fit) for the terminal emulator
- react-oidc-context for authentication (Authentik as IdP)
- msw (Mock Service Worker) for mocked backend endpoints (`mocks/`)

## Folder structure

- `app/` — providers (`providers.tsx`), router config (`router.tsx`), `/ui-preview` harness
- `components/ui/` — `Panel`, `Button`, `StatusBadge`: legacy UI primitives used only by `/ui-preview`
- `components/terminal/` — Xterm.js terminal components
- `components/auth/` — auth-related components (ProtectedRoute, etc.)
- `pages/` — `DashboardPage.tsx` (main shell) plus `tui-dashboard.css`
- `features/dashboard/` — extracted dashboard components (`constants.ts`, `tabs/` with `VmTabContent`, `DatabaseTabContent`, `IamTabContent`, `NetworkTabContent`, `StorageTabContent`)
- `features/<service>/` — per-service data layers (`features/vm/` with `types.ts`, `api.ts`, `hooks.ts`, `pages/`)
- `store/` — zustand stores (`themeStore.ts`)
- `lib/` — `mockServiceData.ts` (datasets), theme tokens, generic utils
- `mocks/` — MSW handlers and fake data (`handlers/`, `data/`)
- `styles/` — global CSS (`globals.css`), Tailwind entry point

## Design system

There are two parallel styling systems — know which one you're touching:

1. **The dashboard** (`pages/DashboardPage.tsx` + `pages/tui-dashboard.css`): the
   real product UI. Pure black background (`#000000`), muted blue borders
   (`#3a6ea5`), light-blue box labels (`#4fa8dc`), amber keybinding hints and the
   active-service border/label (`#e8a020`), off-white body text (`#dcdcdc`). Boxes
   are real CSS-bordered elements with an absolutely-positioned label overlapping
   the top border and an optional keybinding hint overlapping the bottom-right.
   Class names are prefixed `fci-` and defined in `tui-dashboard.css`; extend that
   file rather than reaching for Tailwind utilities here, so the exact visual spec
   stays in one place.
2. **`components/ui/` primitives** (`Panel`, `Button`, `StatusBadge`) + `/ui-preview`:
   an earlier rounded box-drawing system (`╭─╮`/`╰─╯` glyphs, Tailwind utilities,
   `--tui-*` CSS variables in `styles/globals.css`). Nothing in the dashboard uses
   these anymore.

- Monospace font stack (`'Courier New', Courier, monospace` on the dashboard;
  `styles/globals.css` sets a broader stack for `/ui-preview`).

## Conventions

- TypeScript everywhere, strict mode, no `any`.
- Keep each PR scoped to only the files listed in its prompt in `pr-prompts.md`.
- All mock endpoints are handled by MSW in `mocks/`.
