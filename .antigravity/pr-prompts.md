# TUI Cloud Dashboard — Claude Code Prompts (38 PRs)

This document turns the sprint-based PR plan into ready-to-paste prompts for Claude Code. Give Claude Code **one prompt per PR**, in order, review the diff, run/test it, commit, then move to the next. Don't batch multiple PRs into one prompt — the whole point of the plan is small, reviewable units.

## How to use this

1. Claude Code reads `CLAUDE.md` at your repo root automatically at the start of every session, so you don't need to repeat the design system or stack in every prompt.
2. For each PR, copy the prompt from the matching section into Claude Code.
3. After Claude Code finishes a PR, actually check the acceptance criteria yourself before starting the next prompt — several later PRs assume earlier ones are truly done.
4. If Claude Code drifts from the TUI aesthetic or the folder structure, point it back at `CLAUDE.md` rather than re-explaining from scratch.

---

# 🟢 COMPLETED TECHNICAL ARCHITECTURE & STATE — Sprint 1–4 (PRs #1–#31)

> **Sprints 1 through 4 (PRs #1–#31) are fully completed.** The core architecture, styling system, MSW mock API data layer, interactive VM management, Recharts metric visualizations, interactive Xterm.js serial terminal emulator, Database service (Monaco SQL editor, data import), IAM service (data layer, live tabs, Zustand store), Storage service (buckets, file browser, metrics), Network service (nested firewall rules, routes, VPC peerings, IPv4 CIDR validation, standardized table layouts), dual styling system consolidation & dead code removal (`PR #24`), Toast/Notification System for Mutations (`PR #25`), Dashboard responsive layout & mobile/tablet UI restructuring (`PR #26`), Global Command Palette & updated keyboard shortcuts (`PR #27`), OIDC auth integration (Authentik) & protected routes (`PR #28`), Error Boundary, 404 page & global loading skeleton (`PR #29`), Dashboard overview/home page with cross-service summary (`PR #30`), and `@tanstack/react-table` migration for the items table (`PR #31`) are implemented and verified end-to-end. See "SPRINT 4 — Polish, Auth, Production Readiness (Consolidated Summary, PRs #24–#31)" below for full detail on every file touched.
>
> **Sprint 5 (PRs #32–#38) is next.** PRs #32–#35 were already scoped in the original roadmap; PRs #36–#38 were added after a codebase gap-analysis (see the Sprint 5 intro below for why).

---

## Technical Overview & Architecture

The application is a single-page **TUI (Terminal User Interface) Cloud Dashboard** emulating a cloud console (AWS/GCP style) with a retro terminal visual design (monospace typography, bordered panel boxes with top-embedded labels, dark terminal color palette).

### Key Architectural Patterns

1. **Flat Routing & Navigation**: Managed via React Router v6 in `src/app/router.tsx`. URLs follow `/services/:serviceId/:tab` (e.g., `/services/vm/details`, `/services/database/details`) with dedicated sub-routes (`/services/vm/create`, `/services/database/create`, `/services/vm/instances/:id`, `/services/vm/instances/:id/console`, `/services/vm/settings`).
2. **Server State & Mock API Layer**: REST endpoints intercepted in-browser by MSW (`src/mocks/browser.ts`, `src/mocks/handlers/vm.ts`, `src/mocks/handlers/database.ts`) with artificial network latency (300-600ms). React Query handles caching, refetching, and state synchronization (`src/features/vm/hooks.ts`, `src/features/database/hooks.ts`).
3. **TUI CSS Design System**: Styled via custom CSS properties (`--dash-*`) in `src/pages/tui-dashboard.css` using the `fci-` class namespace. Pure black `#000000` background, muted blue borders `#3a6ea5`, amber labels `#e8a020`, off-white text `#dcdcdc`.
4. **Dynamic Theme Engine**: 4 switchable color schemes (`default`, `beige`, `mono`, `navy`) stored in Zustand (`src/store/themeStore.ts`). Dynamic color adaptation dynamically updates borders, action buttons, status badges, and link pills.
5. **Accessibility & Modal Portals**: `DashboardModal.tsx` renders via React Portal with dark backdrop (`rgba(0,0,0,0.72)`), Escape key listener, focus trap, and focus capture/restoration to invoking elements.
6. **Database SQL & Data Import Subsystem**: Monaco Editor integration (`SqlEditor.tsx`) with custom dark TUI theme (`fci-sql-dark`), `@tanstack/react-table` query results panel (`QueryResultPanel.tsx`), drag-and-drop file import engine (`DataImportPanel.tsx`), file parsing/validation utilities (`fileParser.ts`, `fileValidator.ts`), and mock SQL script execution & file import MSW endpoints.

---

## File Structure & Component Map

```text
src/
├── app/
│   ├── router.tsx                  # Router configuration (/services/:serviceId/:tab + sub-routes)
│   └── providers.tsx               # QueryClientProvider, ThemeProvider wrappers
├── components/
│   ├── TerminalInput.tsx           # Monospace TUI text input component
│   ├── TerminalSelect.tsx          # Custom TUI select dropdown component
│   ├── database/
│   │   ├── DataImportPanel.tsx     # Drag-and-drop CSV/JSON/SQL file upload & preview component
│   │   └── QueryResultPanel.tsx    # TanStack table component for SQL execution query results
│   ├── editor/
│   │   └── SqlEditor.tsx           # Lazy-loaded Monaco SQL code editor with custom dark TUI theme
│   ├── terminal/
│   │   ├── TerminalView.tsx        # Xterm.js canvas wrapper with @xterm/addon-fit & ResizeObserver
│   │   └── mockShell.ts            # Interactive terminal command parser & fake shell response engine
│   └── ui/
│       ├── AsciiProgressBar.tsx    # ASCII progress bar component (█ filled, ░ empty)
│       └── [Panel, Button, etc]    # Legacy Tailwind UI primitives (rendered at /ui-preview route)
├── features/
│   ├── dashboard/
│   │   ├── columns.ts              # @tanstack/react-table column defs per service (VM/DB/IAM/Network/Storage)
│   │   ├── constants.ts            # SERVICE_TABS, SERVICE_MENUS, ROUTED_TABS, tab type definitions
│   │   ├── DashboardLoading.tsx    # Standardized blinking loading skeleton component
│   │   ├── DashboardModal.tsx      # Accessible portal modal with focus trap & focus restoration
│   │   ├── DashboardOverview.tsx   # Cross-service overview home page (/dashboard summary grid)
│   │   ├── DataTable.tsx           # Reusable @tanstack/react-table wrapper (sort/filter/paginate/select)
│   │   ├── icons.tsx               # Service SVG vector icon definitions & map
│   │   ├── Toast.tsx               # Self-contained toast component & container with auto-dismiss
│   │   └── tabs/
│   │       ├── index.ts            # Central exports for tab content components
│   │       ├── VmTabContent.tsx     # VM tabs: Console (Xterm.js), Storage, Network, Backups, Metrics (Recharts)
│   │       ├── DatabaseTabContent.tsx # Database tabs: Info, Details, Metrics, Backups, SQL Editor, Data Import
│   │       ├── IamTabContent.tsx
│   │       ├── NetworkTabContent.tsx
│   │       └── StorageTabContent.tsx
│   ├── database/
│   │   ├── api.ts                  # Axios endpoints (getDatabases, executeSqlScript, importData, etc.)
│   │   ├── hooks.ts                # React Query hooks (useDatabases, useExecuteSql, useImportData, etc.)
│   │   ├── types.ts                # Interfaces (Database, SqlExecutionResult, ImportOptions, etc.)
│   │   ├── pages/
│   │   │   └── DatabaseCreateForm.tsx # Inline TUI Database creation form component
│   │   └── sections/
│       ├── SqlEditorSection.tsx   # SQL Editor toolbar, script history, Monaco editor, result panel
│       └── DataImportSection.tsx  # Data Import drag-drop panel, preview, import options, status
│   └── vm/
│       ├── api.ts                  # Axios HTTP endpoints (getVms, getVm, createVm, patchVm, deleteVm, getVmMetrics)
│       ├── hooks.ts                # React Query hooks (useVms, useVm, useCreateVm, useUpdateVm, useDeleteVm, useVmMetrics)
│       ├── types.ts                # TypeScript interfaces (VirtualMachine, UpdateVmInput, VmMetricPoint, MetricRange)
│       └── pages/
│           ├── VmCreateForm.tsx    # Inline TUI VM creation form component
│           ├── VmDetailPage.tsx    # Standalone VM instance detail page (/services/vm/instances/:id)
│           └── VmSettingsPage.tsx  # VM settings configuration page (/services/vm/settings)
├── mocks/
│   ├── browser.ts                  # MSW worker setup
│   ├── data/
│   │   ├── databases.ts            # In-memory database store seeded with Faker
│   │   └── vms.ts                  # In-memory store populated with Faker data + update/delete mutations
│   └── handlers/
│       ├── database.ts             # MSW handlers (GET/POST/PATCH/DELETE /api/databases, execute-sql, import-data)
│       └── vm.ts                   # MSW handlers (GET/POST/PATCH/DELETE /api/vms, GET /api/vms/:id/metrics)
├── pages/
│   ├── DashboardPage.tsx           # Main single-page TUI dashboard container & table state coordinator
│   ├── ErrorPage.tsx               # React Router error boundary view (SYSTEM ERROR + dev stack trace)
│   ├── NotFoundPage.tsx            # Retro TUI 404 Not Found page for invalid routes
│   ├── StandaloneConsolePage.tsx   # Standalone full-screen VM serial console view
│   └── tui-dashboard.css           # Core FCI design system styles & CSS theme custom properties
├── store/
│   ├── themeStore.ts               # Zustand store managing visual theme selection
│   └── toastStore.ts               # Zustand store managing toast notification state
└── utils/
    ├── fileParser.ts               # Async file reading & preview parsing utility (CSV, JSON, SQL)
    └── fileValidator.ts            # File size, extension, and import option validation helpers
```

---

## Technical Overview & Accomplishments Across Sprints 1, 2 & 3

Sprints 1 through 3 established the full core architecture, mock API infrastructure, design system, interactive tools, and five live cloud management services (`VM`, `Database`, `IAM`, `Storage`, `Network`).

### 1. Application Infrastructure & State Management

- **Single-Page Application Shell**: Built on React + TypeScript with Vite, flat routing (`/services/:serviceId/:tab`) via React Router v6, and centralized navigation state.
- **Server-State Synchronization**: TanStack React Query handles server-state fetching, mutation lifecycle, query cache invalidation, and background synchronization across all cloud services.
- **Feature UI Stores**: Specialized Zustand feature stores (`useThemeStore`, `useDatabaseStore`, `useIamStore`, `useVmStore`, `useToastStore`) manage per-service UI state, query result sorting, creation form drafts, script histories, and active modal error handling.

### 2. TUI CSS Design System & Theme Engine

- **Terminal User Interface (TUI) Palette**: Standardized custom CSS custom properties (`--dash-*`) in `tui-dashboard.css` using the `fci-` class namespace. Pure black `#000000` background, muted blue borders `#3a6ea5`, amber action labels `#e8a020`, off-white text `#dcdcdc`, and monospace typography.
- **Dynamic 4-Theme Engine**: Switchable visual schemes (`default`, `beige`, `mono`, `navy`) managed via Zustand and synchronized to `data-theme` on the root document element.
- **Accessible Modal Portals**: `DashboardModal.tsx` renders via React Portal with dark backdrop overlay (`rgba(0,0,0,0.72)`), Escape key handling, focus trap, and invoking element focus restoration.

### 3. In-Browser Mock Server (MSW) & Data Layer

- **Stateful REST Layer**: Mock Service Worker (MSW) intercepts all HTTP requests (`/api/vms`, `/api/databases`, `/api/iam/users`, `/api/buckets`, `/api/networks`) with artificial network latency (300-600ms).
- **Faker-Seeded In-Memory Data**: Realistic datasets seeded with Faker for all 5 cloud domains, supporting stateful CRUD mutations (create, status update, patch, soft/hard delete, metric generation).

### 4. Interactive Tools & Subsystems

- **Xterm.js Serial Terminal Console**: `@xterm/xterm` canvas wrapper (`TerminalView`) integrated with `@xterm/addon-fit` and `ResizeObserver`, backed by `mockShell` fake command parser (`help`, `ls`, `uname -a`, `df -h`, `free -m`, `uptime`, `clear`).
- **Monaco SQL Code Editor**: Embedded `@monaco-editor/react` editor (`SqlEditor`) with custom TUI dark theme (`fci-sql-dark`), database-scoped `scriptRef` binding, formatting, and TanStack Table execution results panel (`QueryResultPanel`).
- **File Data Import Engine**: Drag-and-drop upload subsystem (`DataImportPanel`) with client-side preview parsing (`fileParser.ts`) and validation (`fileValidator.ts`) for CSV, JSON, and SQL files.
- **ASCII Progress & Recharts Metrics**: Inline ASCII progress bar component (`AsciiProgressBar`) paired with transparent Recharts `LineChart` time-series visualization with time range selectors (`30m`, `1h`, `3h`, `1w`).

### 5. Multi-Service Cloud Operations & Standardized Layout

- **Cloud Service Workspaces**: Full live UI wiring and data layers across **VM** (compute instances & metrics), **Database** (PostgreSQL/MySQL/Redis instances, backups, connections, SQL editor), **IAM** (users, roles, policy matrix & permission grids), **Storage** (buckets, object browser & byte formatting), and **Network** (VPC/subnets, firewall rules with ALLOW/DENY badges, routes, peerings, CIDR validation).
- **Global Table Standardization**: Standardized table layout across all 5 service lists — character-clip-free header padding (`6px 8px 8px 8px`), row top padding (`10px`), fixed 8ch ID column width. Sorting is now `@tanstack/react-table`-driven (PR #31; `useSortableRows` was removed), and `Region` is service-specific rather than uniform: present as its own column for IAM/Network/Storage, absent for VM/Database (see PR #31's column-def notes below).

---

# SPRINT 4 — Polish, Auth, Production Readiness (Consolidated Summary, PRs #24–#31)

> Sprint 4 took the app from "5 working services on a rough shell" to a
> production-feeling console: one styling system, toasts instead of inline
> text, a responsive mobile/tablet layout, a command palette, real OIDC auth,
> proper error/404 handling, a cross-service home page, and a real data-table
> library powering every items list. All 8 PRs below are done, tested, and
> merged. This section replaces the old one-`##`-per-PR write-ups with a
> single reference — organized by PR — so future sessions can see what
> changed and why without re-reading 8 separate headings.

## PR #24 — `fix: consolidate dual styling system and remove dead code`

- **Dead Code Removal (`src/App.tsx`)**: Deleted the dead wrapper file since `main.tsx` mounts `RouterProvider` directly via `AppProviders`.
- **Theme Constants Consolidation (`src/lib/tui-theme.ts`)**: Replaced stale `themes`/`tuiTheme` runtime objects with `DASH_COLORS` typed constants matching `--dash-*` CSS custom properties for programmatic Recharts/Xterm theming. Retained `TuiStatus` type export for `/ui-preview` back-compat.
- **`VmDetailPage` Migration (`src/features/vm/pages/VmDetailPage.tsx`)**: Restyled from legacy Tailwind primitives (`Panel`, `Button`, `StatusBadge`, `Modal`, `QueryState`) to pure `fci-` CSS, integrated `DashboardModal` for delete confirmation, wrapped in `<div className="fci-page" data-theme={theme}>` for all 4 themes, added a **← Back** button, expanded displayed metadata (`Region`, `OS`, `diskType`).
- **Legacy UI Primitives Annotation (`src/components/ui/`)**: Deprecation comments on `Button.tsx`, `Modal.tsx`, `Panel.tsx`, `QueryState.tsx`, `StatusBadge.tsx` — retained only for `/ui-preview`.
- **Cleanup**: Removed stale `.gitkeep` files from non-empty directories.

## PR #25 — `feat: toast/notification system for mutations`

- **Toast Store (`src/store/toastStore.ts`)**: Zustand store managing `toasts: Toast[]`, auto-generated IDs, custom or 3000ms default auto-dismiss, `addToast`/`removeToast` actions.
- **Toast Component & Container (`src/features/dashboard/Toast.tsx`)**: `ToastContainer`/`ToastItem` via React Portal, fixed bottom-right (`bottom: 60px; right: 20px; z-index: 600`, above modal layer `z-index: 500`), `role="alert"` / `aria-live="assertive"`.
- **CSS (`tui-dashboard.css`)**: `.fci-toast*` namespace, slide-in keyframes, left-border color variants (success `#7ec87e`, error `#e0546a`, info `#4fa8dc`).
- **Dashboard & Form Integration**: Replaced inline success/error text with `addToast` across `VmCreateForm`, `DatabaseCreateForm`, `IamCreateForm`, `BucketCreateForm`, `NetworkCreateForm`, `NetworkTabContent`, and all `DashboardPage` modal mutation handlers (delete/stop/reboot/role-edit/revoke).
- **Modal Refinement (`DashboardModal.tsx`)**: Rounded borders, box-shadow, `backdrop-filter: blur(4px)`, themed `[✕]` close button, `--dash-modal-*` CSS vars across all 4 themes.
- **Tests**: `toastStore.test.ts`, `Toast.test.tsx`, plus toast-integration tests on all 5 create forms. 542/542 passing at the time, clean build.

## PR #26 — `feat: Dashboard responsive layout (mobile/tablet)`

- **Responsive Header**: Row 1 action sequence `Create(+) → Connect(▶) → Delete(✕) → Refresh(↻) → Setting(⚙) → Region → Profile`, standardized 38px height.
- **Service Nav Icons**: Replaced emojis with SVG icons (`VmIcon`/`DatabaseIcon`/`IamIcon`/`StorageIcon`/`NetworkIcon`), uniform 18×18px, `:active` touch feedback.
- **Footer/Profile Relocation**: Sticky-bottom search (`bottom:0; z-index:100`), hid shortcuts/links/ThemeSwitcher on mobile, moved theme swatches + external links (Docs/Grafana/Prometheus/Loki/Chaos/Architecture) into the Profile dropdown.
- **Instance Selection Viewport**: Row selection hides `.fci-itemsbox`, expands `.fci-detail-panel` to 100%; floating `<<` back-notch control; service switch resets to list view.
- **Mobile Search Overlay**: `backdrop-filter: blur(8px)`, `env(keyboard-inset-height)` docking, auto-expanding results container.
- **Terminal/SQL Full-Screen Gate**: Blurred inactive preview + `▶ Connect` CTA on mobile, 100vh full-screen modal (`.fci-mobile-fullscreen-modal`) with `✕ Exit`.
- **Breakpoint Matrix**: `<=1450px` moves theme/links into Profile dropdown; `769–1450px` gives Profile trigger/dropdown mobile-parity sizing and a 50/50 `.fci-maingrid`/`.fci-split-layout` grid; `<=768px` restores the Connect button, fixes `.fci-page`/`.fci-tui` to `100dvh`, removes a stray border line.
- **CodeRabbit Fixes**: Unmounted background Terminal/Monaco instances while full-screen modals open (`VmTabContent.tsx`, `DatabaseTabContent.tsx`), added `role="dialog"`/`aria-modal`/`Escape` handling + `hideActions` to mobile modals, refactored `useIsMobile.ts` with module-level `MOBILE_MEDIA_QUERY`/`COMPACT_MEDIA_QUERY` constants and immediate `mq.matches` sync.
- **Verification**: 33 test files / 544 tests passing, clean build, desktop `>1450px` view untouched.

## PR #27 — `feat: global command palette & updated keyboard shortcuts`

- **`useKeyboardShortcuts.ts`**: Centralized shortcut handling with input-focus guards. `/` or `a` opens palette, `Escape` closes palette/modal/dropdowns, `Ctrl+S` focuses global search, `Ctrl+C` copies selected row name (+ toast), `Ctrl+D` delete flow, `Ctrl+I` Info tab, single-key nav `V`/`D`/`I`/`N`/`S`. `disabled` prop deactivates everything on mobile (`<=768px`).
- **`CommandPalette.tsx`**: Spotlight-style portal, `backdrop-filter: blur(8px)`, live filtering, arrow-key nav with auto-scroll, `Enter` executes, prefixes `:vm` `:db` `:iam` `:net` `:str` `:crt` `:dlt`.
- **Desktop Shortcut Footer**: Restored for `>1450px` only, `(vm)`/`(db)`/`(iam)`/`(net)`/`(str)` parenthesized hint labels.
- **Mobile Guard**: Listeners and palette both fully disabled `<=768px`.
- **Tests**: `CommandPalette.test.tsx` (11), `useKeyboardShortcuts.test.tsx` (9) — portal rendering, filtering, nav, Enter/Escape, focus guards, mobile disable. 567/567 passing, clean build.

## PR #28 — `feat: OIDC auth integration (Authentik) and protected routes`

- **`src/lib/oidc.ts`**: `getOidcConfig()`/`isOidcConfigured()` parse `VITE_OIDC_AUTHORITY`/`VITE_OIDC_CLIENT_ID`/`VITE_OIDC_REDIRECT_URI` (default `window.location.origin + '/callback'`); falls back to unauthenticated pass-through when unset.
- **`src/app/providers.tsx`**: `react-oidc-context` `AuthProvider` configured dynamically; `onSigninCallback` strips OIDC query params; wraps app in `<AuthTokenSync />`.
- **`src/lib/axios.ts` + `AuthTokenSync.tsx`**: `setAuthToken()` export + request interceptor for `Authorization: Bearer`; `AuthTokenSync` keeps axios token synced with `useAuth()`.
- **`ProtectedRoute.tsx`**: Redirects unauthenticated users to `/login` (preserving `pathname+search` for post-login return), shows `[ AUTHENTICATING... ]` while resolving, passes through when OIDC unconfigured.
- **`LoginPage.tsx`**: Centered TUI login (`fci-login-screen`/`fci-login-panel`), `[ Sign in with Authentik ]` → `auth.signinRedirect()`, auto-redirects authenticated users.
- **Router**: Added `/login`, `/callback`; wrapped all dashboard/service routes in `ProtectedRoute`.
- **Sign Out**: Profile dropdown wired to `auth.signoutRedirect()`, or an "Auth not configured" toast in pass-through mode.
- **`.env.example`**: Documented `VITE_OIDC_AUTHORITY`/`VITE_OIDC_CLIENT_ID`/`VITE_OIDC_REDIRECT_URI`.

## PR #29 — `feat: error boundary, 404 page, global loading skeleton`

- **`NotFoundPage.tsx`**: `fci-status-screen` 404 with `RESOURCE NOT FOUND` title and `[ Return to Dashboard ]`.
- **`ErrorPage.tsx`**: `SYSTEM ERROR` boundary, dev-mode (`import.meta.env.DEV`) stack trace in `fci-console-log`, `[ Return to Dashboard ]`.
- **Router**: `errorElement={<ErrorPage />}` on the root route group, catch-all `path: '*'` → `NotFoundPage`.
- **`DashboardLoading.tsx`**: Reusable blinking `[ LOADING... ]` (custom label supported), `fci-blink` keyframes.
- **Standardization**: Items-table loading row and all tab metric/object views (`VmMetricsTab`, `DatabaseMetricsTab`, `ObjectsTab`, `StorageMetricsTab`) unified on `DashboardLoading`.
- **CSS**: `.fci-status-screen`/`.fci-status-box`/`.fci-status-error`/`.fci-status-title`/`.fci-status-message`/`.fci-status-btn`/`.fci-status-detail`.
- **Verification**: 567/567 tests, clean build.

## PR #30 — `feat: Dashboard overview/home page with cross-service summary`

- **`DashboardOverview.tsx`**: `/dashboard` summary page — 5 service cards (VM/Database/IAM/Storage/Network) with live counts + status breakdowns via `useVms`/`useDatabases`/`useIamUsers`/`useBuckets`/`useNetworks`, colored dot per card, last-created resource + date, click-through to `/services/:slug/info`.
- **Recent Activity & System Status**: Chronologically sorted hardcoded activity feed; hardcoded infra health panel (API latency `42ms`, uptime `99.98%`, `0 active alerts`).
- **`icons.tsx`**: Extracted `VmIcon`/`DatabaseIcon`/`IamIcon`/`StorageIcon`/`NetworkIcon` + `SERVICE_ICONS` out of `DashboardPage.tsx` into a shared module (also consumed by PR #31's column defs).
- **Router & Title Link**: `/dashboard` now renders `<DashboardOverview />` inside `<ProtectedRoute>` (was a redirect to `/services/vm/info`); "Free Cloud Initiative" header title became a `.fci-tui-title-link` button navigating to `/dashboard`.
- **CSS**: `.fci-overview-body`/`-grid`/`-card`/`-card-head`/`-dot`/`-card-name`/`-card-count`/`-card-breakdown`/`-card-last`/`-activity-list`/`-activity-row`/`-activity-time`/`-status-grid`/`-stat-label`/`-stat-value`, plus `.fci-tui-title-link`.
- **Tests**: `DashboardOverview.test.tsx` — live fetching, status rendering, card nav, activity/status sections.

## PR #31 — `feat: @tanstack/react-table migration for items table`

- **`DataTable.tsx`** (new, `features/dashboard/`): Generic `DataTable<T extends {id: string}>` wrapping `@tanstack/react-table` (`/legacy` subpath API — `useLegacyTable as useReactTable`, `LegacyColumnDef as ColumnDef`, matching the precedent in `components/database/QueryResultPanel.tsx`). Props: `data`, `columns`, `onRowClick`, `selectedRowId`, `globalFilter`, `onGlobalFilterChange`, optional `renderActions`/`isLoading`/`isError`/`errorMessage`/`emptyMessage`/`pageSize` (default 10). Owns sorting (`getSortedRowModel`, default `name` ascending, `enableSortingRemoval: false` for a clean 2-state ▲/▼ toggle), filtering (`getFilteredRowModel`), and pagination (`getPaginationRowModel`, `[ < ] Page X of Y [ > ]` styled with `.fci-linkbtn`). Reuses the existing `.fci-th-sortable`/`.fci-th-btn`/`.fci-sort-indicator`/`.fci-sort-active`/`.fci-col-id`/`.fci-td-actions` classes for pixel parity with the old hand-rolled table.
- **`columns.ts`** (new): One column-def factory per service (`getVmColumns`/`getDatabaseColumns`/`getIamColumns`/`getNetworkColumns`/`getStorageColumns`) operating on the existing generic `ServiceRow` shape. New header sets **deliberately drop the Zone column everywhere** and **add a Region column for IAM/Network/Storage only** (VM/Database still have none): VM `# Name Status OS IP Mem CPU`, Database `# Name Status Engine Endpoint Mem Storage`, IAM `# User Status Role "Last Login" MFA Region`, Network `# Name Status Type CIDR Region Gateway`, Storage `# Name Status Access Size Region Objects`. Status/Access/Objects cells keep the colored-pill look via `SERVICE_DATASETS[...].statusColors`/`col3Colors`/`col5Colors` from `mockServiceData.ts`.
- **Search box decision**: rather than repurposing the existing per-service `fci-service-search` input (which opens a tab/action-jump dropdown, unrelated to rows), added one new dedicated `.fci-table-filter` input per items-box that drives that table's `globalFilter` only.
- **`DashboardPage.tsx`**: Removed the inline `<table>`, `useSortableRows`/`SortableHeader` usage, and the manual loading/error/empty `<tbody>` branches (now owned by `DataTable`). The 5 services' per-row action `<td>` content (VM connect/delete, Database connect/delete, IAM delete, Storage add-file/delete, Network delete — plus `VmUsageCell`/`DatabaseUsageCell`/`BucketUsageCell`) was relocated verbatim into a `renderActions` callback passed to `<DataTable>`, keyed by `activeService`; `<DataTable key={activeService} ...>` forces a full remount per service switch so sort/pagination state doesn't leak across tables.
- **Deleted**: `features/dashboard/useSortableRows.ts`, `features/dashboard/SortableHeader.tsx` (superseded).
- **CSS**: Added `.fci-table-filter`, `.fci-table-pagination`, `.fci-linkbtn:disabled` to `tui-dashboard.css`.
- **Tests**: New `DataTable.test.tsx` (12 tests — sort toggle/indicators, global filter, pagination bounds, selected-row highlight, `onRowClick`, `renderActions` click-isolation, loading/error/empty states) and `RegionFilter.test.tsx` updated for the new header set (VM has no Zone/Region column; IAM's Region column used to verify the region filter instead). Full suite: **580/580 passing**, clean build, clean lint.

---

# SPRINT 5 — Refactor, Accessibility & Deployment Readiness

PRs #32–#35 were already scoped in the original 35-PR roadmap (real
WebSocket terminal, code-splitting, MSW integration tests, Docker/deploy
readiness). Before starting Sprint 5, the codebase was re-analyzed against
`CLAUDE.md`'s "Identified Technical Debt" list and a `TODO`/demo-stub sweep,
which surfaced three more PRs worth doing in this sprint:

- **PR #36** — `DashboardPage.tsx` is still the #1 tech-debt item from
  `CLAUDE.md` (now ~2,700+ lines, larger than when that debt was first
  logged) and PR #31 made it slightly worse by inlining all 5 services'
  row-action JSX. Worth decomposing before more feature PRs land on top of it.
- **PR #37** — a component-level audit found only ~14 `aria-*` attributes
  across the entire dashboard shell, and several custom dropdowns/menus are
  plain `<div onClick>` elements with no keyboard path. Reasonable to close
  before calling the app "production ready."
- **PR #38** — a `TODO`/`(demo)` grep across `src/` found three tab views
  (Database Connections, IAM Activity, Storage Access) still backed by
  hardcoded placeholder data, and several `window.alert(...)` stand-ins for
  actions that don't have a real handler yet — inconsistent with how every
  other list/detail view in the app is MSW-backed.

> **Note on PR #34 as originally scoped**: its setup steps (install Vitest/
> RTL/MSW, add `src/test/setup.ts`, add the `test` npm script) are already
> done — that infrastructure shipped as part of PR #25 back in Sprint 4, and
> `src/test/server.ts` already wires up all 5 services' MSW handlers for
> Node-based tests. All 5 services already have `hooks.test.tsx` files
> (list + create at minimum) under `src/features/*/__tests__/`. Treat PR
> #34 below as "verify coverage is complete and fill any real gaps"
> (mutation/error-path edge cases, `useVmMetrics`/`useDatabaseMetrics`
> range handling, etc.) rather than a from-scratch setup — the prompt is
> left as originally written for reference, since the described end-state
> is still the right bar to check the existing suite against.

## PR #32 — `feat: WebSocket connection layer for real terminal`

````markdown
Add the WebSocket connection code for the Xterm.js terminal component so it's
ready for real backend use, while still defaulting to mock mode.

1. Create `lib/websocket.ts`:
   - Export a `TerminalWebSocket` class that manages a WebSocket connection:
     - Constructor: `new TerminalWebSocket(url: string, options?: { reconnect?: boolean, maxRetries?: number })`
     - Methods: `connect()`, `disconnect()`, `send(data: string)`,
       `onData(callback)`, `onClose(callback)`, `onError(callback)`, `onRetryExhausted(callback)`.
     - Automatic reconnect on unexpected close (with exponential backoff,
       max 3 retries). Expose explicit `onRetryExhausted` event when `maxRetries` is reached.
     - Clean `disconnect()` method that prevents reconnect attempts and avoids triggering fallback on component unmount/cleanup.
   - The URL pattern for terminals: `ws://<host>/ws/terminal/:vmId`
     (configurable via `VITE_WS_BASE_URL` env var).

2. Update `components/terminal/TerminalView.tsx`:
   - Implement the `"websocket"` mode branch (currently a stub):
     - On mount (when `mode === "websocket"`), create a `TerminalWebSocket`
       instance and connect.
     - Pipe terminal input → WebSocket send.
     - Pipe WebSocket data → terminal write.
     - While retrying, display `\r\n[Connection lost. Reconnecting...]\r\n`.
     - Switch to mock mode fallback displaying `\r\n[Connection failed. Falling back to mock mode.]\r\n` ONLY after `onRetryExhausted` is emitted (do not trigger fallback on unmount/cleanup close events).
   - Accept an optional `wsUrl` prop for the WebSocket URL.

3. Gate the WebSocket mode behind a feature flag:
   - Use `VITE_ENABLE_REAL_TERMINAL` env var (default: not set = false).
   - In the VM console tab (`VmTabContent`), check this flag by explicitly comparing `import.meta.env.VITE_ENABLE_REAL_TERMINAL === "true"`:
     - If `=== "true"`: pass `mode="websocket"` and `wsUrl` to `TerminalView`.
     - Otherwise (unset or `"false"`): pass `mode="mock"` (current behavior, unchanged).

4. Update `.env.example`:
   ```
   VITE_ENABLE_REAL_TERMINAL=false
   VITE_WS_BASE_URL=ws://localhost:8080
   ```

Scope: `lib/websocket.ts`, `components/terminal/TerminalView.tsx`,
`features/dashboard/tabs/VmTabContent.tsx`, `.env.example`.

Acceptance criteria:

- With `VITE_ENABLE_REAL_TERMINAL` unset: terminal works in mock mode exactly
  as before.
- The WebSocket class is correctly implemented (no runtime errors when imported).
- `npm run build` succeeds with no TypeScript errors.
- No console errors from the WebSocket code path when the flag is off.
````

---

## PR #33 — `chore: code-splitting, lazy routes, production build optimization`

````markdown
Optimize the production build with code splitting and lazy loading.

1. Update `app/router.tsx` and `DashboardPage.tsx`:
   - Convert page-level imports to `React.lazy()` with `<Suspense>` boundaries:
     - `DashboardPage` — lazy (it's the main chunk, but separating it from the
       router bootstrap reduces initial parse time).
     - `LoginPage` — lazy.
     - `NotFoundPage` — lazy.
     - `VmDetailPage` — lazy.
     - All create form pages — lazy.
   - Use the `DashboardLoading` component (from PR #29) as the `<Suspense>`
     fallback for visual consistency.
   - Defer charting and terminal dependencies: in `DashboardPage.tsx` / tab components, use `React.lazy()` or dynamic `import()` for Recharts metrics charts (`VmMetricsTab`, `DatabaseMetricsTab`) and Xterm.js console components (`TerminalView`), so Recharts and Xterm bundles are fetched on demand only when those specific tabs are opened.

2. Configure Vite 8 / Rolldown build output for sensible chunk splitting:
   - In `vite.config.ts`, configure `build.rollupOptions.output.manualChunks` using a function (Vite 8 / Rolldown compatible):
     ```ts
     manualChunks(id) {
       if (id.includes('node_modules/recharts')) return 'vendor-charts'
       if (id.includes('node_modules/@xterm')) return 'vendor-terminal'
       if (id.includes('node_modules/@tanstack')) return 'vendor-query'
       if (id.includes('node_modules/react')) return 'vendor-react'
     }
     ```
   - This ensures Recharts and Xterm.js are in separate chunks loaded only
     when their respective routes or tabs are visited.

3. Run `npm run build` and verify:
   - The initial page load (first chunk) does NOT include recharts or xterm code.
   - Navigating to a metrics tab triggers a separate chunk load for recharts.
   - Navigating to the console tab triggers a separate chunk load for xterm.

4. Optional: add `vite-bundle-visualizer` as a dev dependency and generate a
   report to verify the chunk split. If you do, add the command to
   `package.json` scripts: `"build:analyze": "vite build && npx vite-bundle-visualizer"`.

Scope: `app/router.tsx`, `vite.config.ts`, `package.json` (optional).

Acceptance criteria:

- `npm run build` completes without errors.
- Build output shows separate chunks for react, react-query, recharts, xterm.
- Navigating the app after `npm run preview` works correctly with lazy loading.
- `npm run build` succeeds.
````

---

## PR #34 — `test: MSW integration tests for critical flows`

````
Add integration tests that verify critical CRUD flows work end-to-end through
the MSW mock layer.

1. Install `vitest` and `@testing-library/react` as dev dependencies:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
````

2. Configure Vitest in `vite.config.ts`:
   - Add `/// <reference types="vitest/config" />` directive at the top of `vite.config.ts` (or import `defineConfig` from `'vitest/config'`) to ensure `test` property satisfies strict TypeScript typechecking:

     ```ts
     /// <reference types="vitest/config" />
     import { defineConfig } from "vite";

     export default defineConfig({
       // ...
       test: {
         environment: "jsdom",
         globals: true,
         setupFiles: ["./src/test/setup.ts"],
       },
     });
     ```

3. Create `src/test/setup.ts`:
   - Import `@testing-library/jest-dom`.
   - Set up MSW server (not browser worker) and reset in-memory mock stores for state isolation:

     ```ts
     import { setupServer } from 'msw/node'
     import { vmHandlers } from '@/mocks/handlers/vm'
     import { resetVmStore } from '@/mocks/data/vms'
     import { resetDatabaseStore } from '@/mocks/data/databases'
     // ... import all handlers and store reset functions

     export const server = setupServer(...vmHandlers, ...databaseHandlers, ...)
     beforeAll(() => server.listen())
     afterEach(() => {
       server.resetHandlers()
       resetVmStore()
       resetDatabaseStore()
       // ... reset all mutable mock stores
     })
     afterAll(() => server.close())
     ```

4. Add `"test"` script to `package.json`: `"test": "vitest run"`.

5. Write integration tests for the VM service (`src/features/vm/__tests__/vm.test.tsx`):
   - Test: `useVms()` fetches and returns VM list from MSW.
   - Test: `useCreateVm()` creates a VM and invalidates the list.
   - Test: `useDeleteVm()` deletes a VM and invalidates the list.
   - Test: `useVmMetrics(id)` fetches 24-point metric series.

6. Write at least one test per remaining service to verify the data layer works:
   - `src/features/database/__tests__/database.test.tsx` — list + create.
   - `src/features/iam/__tests__/iam.test.tsx` — list + create.
   - `src/features/network/__tests__/network.test.tsx` — list + firewall rule add.
   - `src/features/storage/__tests__/storage.test.tsx` — list + bucket files.

Scope: `vite.config.ts`, `package.json`, `src/test/setup.ts`,
`src/features/*/__tests__/*.test.tsx`.

Acceptance criteria:

- `npm test` runs all tests and they all pass.
- Tests verify CRUD operations through MSW (not mocking axios directly).
- `npm run build` still succeeds.

`````

---

## PR #35 — `chore: Docker build, env config, deployment readiness`

````markdown
Finalize the project for production deployment.

1. Update `Dockerfile` for a proper multi-stage build:
   ```dockerfile
   # Build stage
   FROM node:20-alpine AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   ARG VITE_API_BASE_URL
   ARG VITE_OIDC_AUTHORITY
   ARG VITE_OIDC_CLIENT_ID
   ARG VITE_OIDC_REDIRECT_URI
   ARG VITE_WS_BASE_URL
   ARG VITE_ENABLE_REAL_TERMINAL

   ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
       VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY \
       VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID \
       VITE_OIDC_REDIRECT_URI=$VITE_OIDC_REDIRECT_URI \
       VITE_WS_BASE_URL=$VITE_WS_BASE_URL \
       VITE_ENABLE_REAL_TERMINAL=$VITE_ENABLE_REAL_TERMINAL

   RUN npm run build

   # Production stage
   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/templates/default.conf.template
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. Create `nginx.conf` for SPA routing (placed as template at `/etc/nginx/templates/default.conf.template` so Nginx resolves `API_BACKEND_URL` at container startup):
   ```nginx
   server {
     listen 80;
     root /usr/share/nginx/html;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }

     location /api/ {
       proxy_pass ${API_BACKEND_URL};
     }

     location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
     }
   }
   ```

3. Update `.env.example` with all environment variables documented (build-time `VITE_*` args and runtime container variables):
   ```
   # API (Build-time)
   VITE_API_BASE_URL=

   # OIDC Authentication (Authentik) (Build-time)
   VITE_OIDC_AUTHORITY=https://auth.example.com/application/o/fci/
   VITE_OIDC_CLIENT_ID=
   VITE_OIDC_REDIRECT_URI=http://localhost:5173/callback

   # WebSocket Terminal (Build-time)
   VITE_ENABLE_REAL_TERMINAL=false
   VITE_WS_BASE_URL=ws://localhost:8080

   # Nginx Reverse Proxy (Container Runtime)
   API_BACKEND_URL=http://backend:8080
   ```

4. Update `README.md` with:
   - Project overview and screenshot placeholder.
   - Tech stack list.
   - Development setup instructions (`npm install`, `npm run dev`).
   - Environment variables documentation (table of build-time `VITE_*` args supplied via Docker `--build-arg` and runtime `API_BACKEND_URL` passed via container environment).
   - Docker build instructions (`docker build --build-arg VITE_...=... -t fci-frontend .`).
   - Production deployment notes (running container with `-e API_BACKEND_URL=...`).

5. Run final verification:
   - `npm run build` — clean build, no errors.
   - `npm run lint` — no lint errors.
   - `npm test` — all tests pass.
   - `docker build -t fci-frontend .` — Docker image builds successfully.

Scope: `Dockerfile`, `nginx.conf` (new), `.env.example`, `README.md`,
`package.json` (if scripts need updating).

Acceptance criteria:
- `npm run build` succeeds.
- `npm run lint` passes.
- `npm test` passes.
- Docker image builds and serves the app correctly.
- README is comprehensive and accurate.
`````

---

## PR #36 — `refactor: decompose monolithic DashboardPage.tsx`

```markdown
`src/pages/DashboardPage.tsx` is ~2,700+ lines and still growing with every
service PR (PR #31 alone added the full per-service `renderActions` JSX
inline). This is `CLAUDE.md`'s Identified Technical Debt item #1
("Monolithic DashboardPage.tsx") and it has only gotten worse since tab
content was extracted in earlier sprints — extract the remaining
service-specific and structural blocks into dedicated modules so the shell
file shrinks to routing/layout glue.

1. Extract per-service row-action renderers (added inline in PR #31) into
   `features/dashboard/actions/` — one file per service
   (`VmRowActions.tsx`, `DatabaseRowActions.tsx`, `IamRowActions.tsx`,
   `StorageRowActions.tsx`, `NetworkRowActions.tsx`), each exporting a
   `(row: ServiceRow) => ReactNode` that takes its mutation/handler
   dependencies as props — no behavior changes, straight relocation.

2. Extract the detail panel (the `.fci-detail-panel` block covering VM,
   Database, IAM, Storage, Network detail views, tab dispatch, and field
   labels) into `features/dashboard/DetailPanel.tsx`, taking the active
   service, selected resource, and tab state as props.

3. Extract modal action handlers (delete/stop/reboot/role-edit/revoke
   confirmation flows currently inlined in `DashboardPage.tsx`) into a
   `features/dashboard/useDashboardModals.ts` hook returning the modal state
   and handler functions, so `DashboardPage.tsx` just wires it to
   `<DashboardModal>`.

4. Extract the mobile top-bar action row and the service-box/search-dropdown
   grid (`.fci-topgrid`) into `features/dashboard/TopBar.tsx` /
   `features/dashboard/ServiceSearchGrid.tsx`.

5. After extraction, `DashboardPage.tsx` should primarily: read route
   params, own top-level state (`selectedRowId`, `activeTab`, etc.), fetch
   the 5 services' React Query hooks, and compose the extracted components.
   No behavior or visual changes — this is a pure refactor.

Scope: `pages/DashboardPage.tsx`, new files under `features/dashboard/`
(`actions/`, `DetailPanel.tsx`, `useDashboardModals.ts`, `TopBar.tsx`,
`ServiceSearchGrid.tsx`).

Acceptance criteria:

- `DashboardPage.tsx` is reduced to well under 1,000 lines.
- No behavior, styling, or test regressions — full existing test suite
  passes unchanged (adjust import paths only, not assertions).
- `npm run build` succeeds.
- Manual smoke test: all 5 services still list/select/detail/mutate exactly
  as before across all 4 themes and at 375px/768px/1440px.
```

---

## PR #37 — `feat: accessibility pass — ARIA roles, keyboard navigation, automated a11y checks`

```markdown
The dashboard's custom interactive elements (Profile dropdown, Region
selector, per-service search/action dropdowns, Command Palette, modals) are
mostly plain `<div onClick>` elements with only ~14 `aria-*` attributes
across all of `DashboardPage.tsx`. Bring the app to a baseline accessible
standard before further production-readiness work.

1. Audit and fix custom dropdowns (`Region` selector, `Profile` menu,
   per-service search-result dropdowns in the topgrid boxes):
   - Add `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space to
     activate) wherever a `<div>` currently only has `onClick`.
   - Add `aria-haspopup="listbox"` / `aria-expanded` to dropdown triggers,
     `role="listbox"`/`role="option"` (or `menu`/`menuitem` as appropriate)
     to the dropdown panels and their items.
   - Ensure `Escape` closes each dropdown and returns focus to its trigger
     (some of this already exists via `useKeyboardShortcuts` — audit for
     gaps rather than re-implementing).

2. Audit the items table (`DataTable.tsx` from PR #31): add
   `scope="col"` to header cells, ensure the sortable header `<button>`s
   have accessible names that describe the action (e.g.
   `aria-label="Sort by Name"` rather than relying on visible text alone
   when the sort glyph is the only visual cue), and confirm row click
   targets are also keyboard-operable (`tabIndex`, Enter to select) or
   explicitly document why they're mouse/touch-only if left as-is.

3. Audit `DashboardModal.tsx` and `CommandPalette.tsx` focus trap behavior
   against WAI-ARIA APG dialog pattern: focus moves into the dialog on
   open, `Tab`/`Shift+Tab` cycle within it, focus returns to the invoking
   element on close (verify — some of this may already be implemented;
   fill gaps only).

4. Add `eslint-plugin-jsx-a11y`-equivalent coverage via `oxlint`'s built-in
   a11y rules (check `oxlint`'s ruleset for a `jsx-a11y` category and
   enable it in the lint config) so future PRs get caught automatically.

5. Add automated accessibility tests using `vitest-axe` (or `jest-axe` via
   the Vitest-compatible import) on the highest-traffic components:
   `DashboardOverview`, the items table (`DataTable`), `DashboardModal`,
   and `CommandPalette` — assert zero critical/serious axe violations.

Scope: `pages/DashboardPage.tsx`, `features/dashboard/DataTable.tsx`,
`features/dashboard/DashboardModal.tsx`, `features/dashboard/CommandPalette.tsx`,
lint config, new `*.a11y.test.tsx` files.

Acceptance criteria:

- All custom dropdowns are keyboard-operable (Tab to reach, Enter/Space to
  open, arrow keys to navigate options, Escape to close).
- axe-core reports zero critical/serious violations on the audited
  components.
- `npm run build` and `npm test` succeed with no regressions.
```

---

## PR #38 — `feat: wire remaining demo stubs to mock endpoints`

```markdown
A codebase sweep for `TODO`/demo markers found several UI areas still
backed by hardcoded data or `window.alert(...)` stand-ins instead of the
MSW-backed pattern the rest of the app follows. Close these gaps so every
service is consistently "live," matching the standard set by VM/Database/
IAM/Storage/Network's list+detail views.

1. `features/dashboard/tabs/DatabaseTabContent.tsx` (see the `TODO` at the
   top of the Connections tab): there is no `/api/databases/:id/connections`
   endpoint. Add one to `mocks/handlers/database.ts` (Faker-seeded,
   consistent with `getDatabases`/`getDatabaseById`) and wire the
   Connections tab to fetch it via a new `useDatabaseConnections(id)` hook
   in `features/database/hooks.ts`, replacing the static demo table.

2. `features/dashboard/tabs/IamTabContent.tsx` (see the `TODO` on the
   Activity tab): there is no activity-log endpoint. Add
   `GET /api/iam/users/:id/activity` to `mocks/handlers/iam.ts` and a
   `useIamUserActivity(id)` hook, replacing the hardcoded entries. (Note:
   `DashboardOverview`'s "Recent Activity" section — PR #30 — is
   intentionally kept as cross-service hardcoded data per its own spec;
   don't touch that one.)

3. `features/dashboard/tabs/StorageTabContent.tsx` (see the `TODO` on the
   Access tab): there is no access-policy endpoint. Add
   `GET /api/buckets/:id/access-policies` to `mocks/handlers/storage.ts`
   and a `useBucketAccessPolicies(id)` hook, replacing the static table.

4. Replace the remaining `window.alert(...)` demo stubs in
   `DashboardPage.tsx` with real behavior or an honest toast, per case:
   - VM "Connect via terminal" (`window.alert(\`Connect to ${row.name}
     (demo)\`)`) → navigate to the existing standalone console route
     `/console/:vmName` (via `navigate(\`/console/${encodeURIComponent(row.name)}\`)`)
     instead of alerting. This is the only registered route for
     jumping straight to a specific VM's console by name — the tab route
     `/services/vm/console` only shows a console for whatever VM is
     already selected in `selectedRowId`, which a row's own action button
     can't assume.
   - Generic `Refresh`/`Settings`/`Add new resource` alerts for services
     that don't yet have a real action (e.g. Database/IAM/Storage/Network
     "Settings") → replace `window.alert` with
     `addToast('X not available yet', 'info')` so it matches the app's
     established notification pattern instead of a native browser alert.

Scope: `mocks/handlers/database.ts`, `mocks/handlers/iam.ts`,
`mocks/handlers/storage.ts`, `features/database/hooks.ts`,
`features/iam/hooks.ts`, `features/storage/hooks.ts`,
`features/dashboard/tabs/DatabaseTabContent.tsx`,
`features/dashboard/tabs/IamTabContent.tsx`,
`features/dashboard/tabs/StorageTabContent.tsx`, `pages/DashboardPage.tsx`.

Acceptance criteria:

- No remaining `TODO` markers in the three tab-content files listed above.
- No `window.alert(...)` calls remain in `DashboardPage.tsx` (grep should
  return zero matches).
- Database Connections, IAM Activity, and Storage Access tabs show
  MSW-fetched data with loading/error states matching the existing
  `DashboardLoading` pattern.
- `npm run build` and `npm test` succeed with no regressions.
```
