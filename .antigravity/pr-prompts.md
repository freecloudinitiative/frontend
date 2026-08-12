# TUI Cloud Dashboard — Claude Code Prompts (38 PRs)

This document turns the sprint-based PR plan into ready-to-paste prompts for Claude Code. Give Claude Code **one prompt per PR**, in order, review the diff, run/test it, commit, then move to the next. Don't batch multiple PRs into one prompt — the whole point of the plan is small, reviewable units.

## How to use this

1. Claude Code reads `CLAUDE.md` at your repo root automatically at the start of every session, so you don't need to repeat the design system or stack in every prompt.
2. For each PR, copy the prompt from the matching section into Claude Code.
3. After Claude Code finishes a PR, actually check the acceptance criteria yourself before starting the next prompt — several later PRs assume earlier ones are truly done.
4. If Claude Code drifts from the TUI aesthetic or the folder structure, point it back at `CLAUDE.md` rather than re-explaining from scratch.

---

# 🟢 COMPLETED TECHNICAL ARCHITECTURE & STATE — Sprint 1–5 (PRs #1–#39)

> **Sprints 1 through 5 (PRs #1–#39) are fully completed.** The core architecture, styling system, MSW mock API data layer, interactive VM management, Recharts metric visualizations, interactive Xterm.js serial terminal emulator, Database service (Monaco SQL editor, data import), IAM service (data layer, live tabs, Zustand store), Storage service (buckets, file browser, metrics), Network service (nested firewall rules, routes, VPC peerings, IPv4 CIDR validation, standardized table layouts), dual styling system consolidation & dead code removal (`PR #24`), Toast/Notification System for Mutations (`PR #25`), Dashboard responsive layout & mobile/tablet UI restructuring (`PR #26`), Global Command Palette & updated keyboard shortcuts (`PR #27`), OIDC auth integration (Authentik) & protected routes (`PR #28`), Error Boundary, 404 page & global loading skeleton (`PR #29`), Dashboard overview/home page with cross-service summary (`PR #30`), `@tanstack/react-table` migration for the items table (`PR #31`), WebSocket connection layer for real terminal (`PR #32`), Code-splitting & lazy routes optimization (`PR #33`), MSW integration tests for critical flows (`PR #34`), Docker build & deployment readiness (`PR #35`), Monolithic `DashboardPage.tsx` decomposition (`PR #36`), Baseline accessibility pass (`PR #37`), Global Cross-Service Search (`PR #38`), and Service Settings Views with retro TUI styling (`PR #39`) are implemented and verified end-to-end.

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

- **PR #36** — `refactor: decompose monolithic DashboardPage.tsx` (Completed). Decomposed `DashboardPage.tsx` from ~2,350 lines down to ~798 lines by extracting per-service row actions, detail panel, top bar controls, search grid, profile menu, region selector, and modal state management hook.
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

## PR #32 — `feat: WebSocket connection layer for real terminal` (Completed)

- **TerminalWebSocket Class (`src/lib/websocket.ts`)**: Manages WebSocket connections (`ws://<host>/ws/terminal/:vmId`, configurable via `VITE_WS_BASE_URL`), auto-reconnects with exponential backoff (max 3 retries), exposes `onRetryExhausted` event, and features a clean `disconnect()` method that suppresses reconnects during component unmount.
- **WebSocket Mode in TerminalView (`src/components/terminal/TerminalView.tsx`)**: Implemented the `"websocket"` mode branch, connecting on mount, piping terminal input to WebSocket send and socket data to terminal write. Shows `[Connection lost. Reconnecting...]` during retries and `[Connection failed. Falling back to mock mode.]` when retries exhaust.
- **Feature Flag Gating (`src/features/dashboard/tabs/VmTabContent.tsx`)**: Gated behind `import.meta.env.VITE_ENABLE_REAL_TERMINAL === "true"`. Unset or `"false"` defaults to mock terminal mode without runtime errors.
- **Environment Config (`.env.example`)**: Added `VITE_ENABLE_REAL_TERMINAL=false` and `VITE_WS_BASE_URL=ws://localhost:8080`.
- **Tests**: Comprehensive unit and integration tests (`websocket.test.ts`, `TerminalView.test.tsx`, `TerminalViewFallback.test.tsx`, `VmTabContentTerminal.test.tsx`) covering connection, exponential backoff, retry exhaustion fallback, clean unmount, and feature flag behavior. Full test suite passing (598/598 tests).

---

## PR #33 — `chore: code-splitting, lazy routes, production build optimization` (Completed)

- **Lazy Routes & Suspense (`src/app/router.tsx`, `src/pages/DashboardPage.tsx`)**: Converted page-level route imports (`LoginPage`, `NotFoundPage`, `VmDetailPage`, `VmCreateForm`, `DatabaseCreateForm`, `IamCreateForm`, `BucketCreateForm`, `NetworkCreateForm`) to `React.lazy()` wrapped with `<Suspense fallback={<DashboardLoading />}>`.
- **Dynamic Chart & Console Deferred Loading (`src/features/dashboard/tabs/`)**: Extracted Recharts charts into standalone lazy-loaded components (`VmMetricsTab.tsx`, `DatabaseMetricsTab.tsx`). Deferred Xterm.js terminal loading so Recharts and Xterm bundles are only fetched on-demand when opening their respective tabs/modals.
- **Vite/Rolldown Chunk Splitting (`vite.config.ts`)**: Configured `manualChunks` in `build.rollupOptions.output` separating `vendor-react` (react, react-dom), `vendor-query` (@tanstack/react-query), `vendor-charts` (recharts), and `vendor-terminal` (@xterm).
- **Verification**: Clean build with optimized chunk sizes, all tests passing.

---

## PR #34 — `test: MSW integration tests for critical flows` (Completed)

- **Comprehensive MSW Integration Test Suite (`src/features/*/__tests__/`)**: Added end-to-end MSW integration tests for all 5 cloud services:
  - `vm.test.tsx`: Tests `useVms` fetching, `useCreateVm` creation & cache invalidation, `useDeleteVm` deletion, and `useVmMetrics` time-series metrics.
  - `database.test.tsx`: Tests `useDatabases` listing, database instance creation, and SQL execution/metrics.
  - `iam.test.tsx`: Tests `useIamUsers` listing, IAM user creation, and role updates.
  - `network.test.tsx`: Tests `useNetworks` listing, VPC network creation, and firewall rule addition/deletion.
  - `storage.test.tsx`: Tests `useBuckets` listing, bucket creation, and object storage file operations.
- **Verification**: All integration tests verify stateful mutations directly through MSW endpoints. Full suite passing cleanly.

---

## PR #35 — `chore: Docker build, env config, deployment readiness` (Completed)

- **Multi-stage Dockerfile (`Dockerfile`)**: Production-ready multi-stage build (`node:20-alpine AS build` -> `nginx:alpine`). Accepts build arguments for all `VITE_*` environment variables (`VITE_API_BASE_URL`, `VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, `VITE_OIDC_REDIRECT_URI`, `VITE_WS_BASE_URL`, `VITE_ENABLE_REAL_TERMINAL`).
- **Nginx Configuration (`nginx.conf`)**: Configured SPA fallback routing (`try_files $uri $uri/ /index.html`), API backend reverse proxy (`/api/` -> `${API_BACKEND_URL}`), and 1-year immutable caching for static assets.
- **Environment Reference (`.env.example`)**: Fully documented all build-time `VITE_*` parameters and runtime container variables (`API_BACKEND_URL`).
- **Documentation (`README.md`)**: Updated with full project overview, tech stack table, local development setup, environment variables reference, Docker build instructions, and production deployment guide.
- **Verification**: `docker build -t fci-frontend .` completed successfully; clean build, lint, and test suite execution.

---

## PR #36 — `refactor: decompose monolithic DashboardPage.tsx` (Completed)

- **Extracted Row Actions (`src/features/dashboard/actions/`)**: Created per-service row action components (`VmRowActions.tsx`, `DatabaseRowActions.tsx`, `IamRowActions.tsx`, `StorageRowActions.tsx`, `NetworkRowActions.tsx`) and exported them via `index.ts`.
- **Extracted Detail Panel (`src/features/dashboard/DetailPanel.tsx`)**: Replaced monolithic detail panel block in `DashboardPage.tsx` with a clean `DetailPanel` component.
- **Extracted Modal Management (`src/features/dashboard/useDashboardModals.ts`, `DashboardModalBody.tsx`)**: Isolated modal state, action handlers, and modal body rendering into a custom hook and modal body component.
- **Extracted Header & Top Controls (`src/features/dashboard/TopBar.tsx`, `ServiceSearchGrid.tsx`, `ProfileMenu.tsx`, `RegionSelector.tsx`)**: Decomposed topbar action row, service search grid, profile menu, and region selector into dedicated modular components.
- **Decomposed `DashboardPage.tsx`**: Reduced `DashboardPage.tsx` size from 2,353 lines down to 798 lines, turning it into a concise layout coordinator.
- **Unit & Integration Tests**: Added comprehensive test suites (`DetailPanel.test.tsx`, `ProfileMenuAndRegionSelector.test.tsx`, `useDashboardModals.test.tsx`).
- **Verification**: Clean build (`npm run build`), all 285 tests passing cleanly across 33 test files.

---

## PR #37 — `feat: accessibility pass — ARIA roles, keyboard navigation, automated a11y checks` (Completed)

- **Custom Dropdown & Menu Semantics (`RegionSelector.tsx`, `ProfileMenu.tsx`, `ServiceSearchGrid.tsx`)**: Upgraded `RegionSelector` to full WAI-ARIA `listbox`/`option` pattern (`aria-haspopup="listbox"`, `aria-expanded`, `aria-selected`, `aria-disabled`, `ArrowDown`/`ArrowUp`/`Home`/`End`/`Enter`/`Space`/`Escape` keyboard navigation, focus restoration on close). Upgraded `ProfileMenu` to full WAI-ARIA `menu`/`menuitem` pattern (`aria-haspopup="menu"`, `aria-expanded`, `ArrowDown`/`ArrowUp`/`Home`/`End`/`Enter`/`Escape` navigation, auto-focus on open). Upgraded `ServiceSearchGrid` search result dropdowns to WAI-ARIA `combobox`/`listbox`/`option` pattern (`aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"` with `ArrowDown`/`ArrowUp`/`Enter`/`Escape` navigation).
- **DataTable Accessibility (`DataTable.tsx`)**: Added `scope="col"` to all `<th>` header cells, visually hidden `.sr-only` actions header, dynamic sort button `aria-label` with sort direction (`Sort by Name, ascending`/`descending`), `aria-label="Previous page"` / `"Next page"` pagination buttons, and explicit `role="row"` on body `<tr>` elements.
- **Dialog Focus Trapping & Restoration (`DashboardModal.tsx`, `CommandPalette.tsx`)**: Replaced hardcoded title ID with React's `useId()` in `DashboardModal`, attached `trapFocus` keydown listener to document for robust focus trapping, and added `invokerRef` focus restoration pattern to `CommandPalette`.
- **Oxlint Accessibility Linting (`.oxlintrc.json`)**: Enabled oxlint's built-in `jsx-a11y` plugin (`"plugins": ["react", "typescript", "oxc", "jsx-a11y"]`).
- **Automated Axe Accessibility Tests (`*.a11y.test.tsx`)**: Installed `vitest-axe` and extended Vitest `expect` (`setup.ts`, `vitest-axe.d.ts`). Added 4 automated axe test suites verifying 0 critical/serious violations: `DataTable.a11y.test.tsx` (default, sorted, filtered, empty, loading states), `DashboardModal.a11y.test.tsx`, `CommandPalette.a11y.test.tsx`, `DashboardOverview.a11y.test.tsx`.
- **Verification**: Clean build (`npm run build`), 0 oxlint errors (`npx oxlint .`), and all 667 unit, integration, and accessibility tests passing across 58 test files.

---

## PR #38 — `feat: global cross-service search and command palette integration` (Completed)

- **Unified Search Hook (`useGlobalSearch.ts`)**: Built a client-side search utility filtering across VMs, Databases, IAM Users, Buckets, and Networks by name, ID, status, region, and type.
- **Top Navigation Search overlay (`GlobalSearchOverlay.tsx`)**: Renders inline matching resource lists with click-to-navigate/highlight logic.
- **Command Palette (`CommandPalette.tsx`)**: Synced text cursor caret shape/blinking and integrated global search overlay alongside shortcode prefixes (`:vm`, `:db`, `:iam`, `:net`, `:str`).

---

## PR #39 — `feat: service settings views with retro TUI styling` (Completed)

- **TUI Settings Forms**: Implemented forms for all 5 services (`VmSettingsPage.tsx`, `DatabaseSettingsPage.tsx`, `IamSettingsPage.tsx`, `BucketSettingsPage.tsx`, `NetworkSettingsPage.tsx`) using retro `fci-` layouts.
- **Settings Endpoint Persistence**: Added React Query mutations and MSW PATCH handlers for all service configurations with green `addToast` success overlays.
- **Header Button Navigation**: Wired top control bar and mobile menu gear buttons (`⚙`) to navigate to `/services/:serviceId/settings`.

---

## PR #40 — `refactor: abstract repetitive MSW mock handlers` (Completed)

- **Generic Handler Factories (`src/mocks/handlers/utils.ts`)**: Abstracted GET-by-ID (`createGetByIdHandler`), DELETE-by-ID (`createDeleteHandler`), and settings PATCH (`createSettingsPatchHandler`) into clean generic factory functions.
- **Service Mocks Consolidation**: Refactored `vm.ts`, `database.ts`, `iam.ts`, `storage.ts`, and `network.ts` handlers to use the generic helpers, eliminating ~250 lines of duplicate mock route boilerplate.
- **Verification**: All 684 unit, integration, and accessibility tests passing cleanly.

---

## PR #41 — `feat: new service options, responsive refinements & pagination removal` (Completed)

- **New Services**: Integrated Load Balancer (`:lb`, key `(lb)`, single hotkey `l`) and Kubernetes (`:k8s`, key `(k8s)`, single hotkey `k`) pages, layouts, icons, commands, and a 'Coming Soon' placeholder content view.
- **Service Buttons & Keys**: Converted the topgrid service buttons to standard UI buttons with embedded SVG icons. Repositioned their parenthesis shortcode key labels to the bottom-right border notch.
- **Top Bar Widths**: Adjusted search box width to 360px and stretched the top grid to fill the remaining area.
- **Responsive Layout Adjustments**:
  - Hides service button labels `.fci-box-label` on viewport widths of 1450px and below, centering icons.
  - Hides parenthetical shortcodes `.fci-box-key` on all top-bar buttons (Services, Search, and Profile) for viewport widths of 1000px and below.
- **Pagination Disable**: Completely removed TanStack pagination controls and the `Page X of Y` footer from `DataTable.tsx`, displaying all items in a single view with vertical scrolling via `.fci-itemslist` under `.fci-itemsbox`.
- **Verification**: Verified builds, lints, and test suites are passing cleanly with zero errors.`
