# Free Cloud Initiative — TUI Cloud Management Dashboard

A high-performance, single-page cloud management console built with **React 18**, **TypeScript**, **Vite**, and **TanStack Query**, featuring a retro **Terminal User Interface (TUI)** aesthetic. Designed to visually emulate a terminal application—utilizing monospace typography, pixel-aligned panel borders, floating labels, dark monochrome tones, and keyboard-first navigation—while offering a modern, dynamic web application user experience.

---

## Technical Overview & Core Architecture

The Free Cloud Initiative (FCI) dashboard provides full lifecycle control over 7 cloud services (**Virtual Machines**, **Database**, **IAM**, **Storage**, **Network**, **Load Balancer**, and **Kubernetes**). The client operates statefully in-browser via **Mock Service Worker (MSW)** while supporting live backend WebSocket connections for interactive terminal streaming and Authentik OIDC authentication.

```text
               ┌──────────────────────────────────────────────────────────┐
               │              React 18 SPA Shell (Vite)                   │
               │   React Router v6 (/dashboard, /services/:service/:tab)   │
               └────────────────────────────┬─────────────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         │                                  │                                  │
┌────────▼────────┐                ┌────────▼────────┐                ┌────────▼────────┐
│ TanStack Query  │                │  Zustand Stores │                │  React-OIDC    │
│  (Server State) │                │  (Theme/Toast)  │                │   (Authentik)   │
└────────┬────────┘                └────────┬────────┘                └────────┬────────┘
         │                                  │                                  │
         │ Axios HTTP Interceptor           │ DOM Theme Attribute              │ Bearer Auth
┌────────▼────────┐                         │                                  │
│ In-Browser MSW  │                         │                                  │
│  REST API Engine│                         │                                  │
└─────────────────┘                         └──────────────────────────────────┘
```

### Key Architectural Subsystems & Deep Dive

1. **Flat Routing & Workspace Navigation**:
   - Implemented using React Router v6 in [`src/app/router.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/app/router.tsx).
   - Routes follow a flat structure: `/dashboard` (overview summary), `/services/:serviceId/:tab` (main tabbed service view), `/services/vm/instances/:id` (standalone VM detail page), `/console/:vmName` (full-screen standalone serial terminal), `/login` & `/callback` (OIDC authentication flow), and `/ui-preview` (legacy component preview sandbox).
   - Page components are code-split using `React.lazy()` and wrapped in `<Suspense fallback={<RouteFallback />}>` using the blinking [`DashboardLoading`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/DashboardLoading.tsx) skeleton.

2. **Server State & In-Browser MSW Mock Engine**:
   - HTTP requests are intercepted in-browser using Mock Service Worker ([`src/mocks/browser.ts`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/mocks/browser.ts), [`src/mocks/handlers/`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/mocks/handlers)).
   - Simulated network latency (300–600ms) mimics real-world backend responses.
   - Handlers utilize generic factory utilities ([`src/mocks/handlers/utils.ts`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/mocks/handlers/utils.ts)) like `createGetByIdHandler`, `createDeleteHandler`, and `createSettingsPatchHandler` to eliminate endpoint boilerplate across all services.
   - Server state caching, optimistic updates, and background revalidations are managed by TanStack Query ([`@tanstack/react-query`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/vm/hooks.ts)).

3. **TUI CSS Design System & Dynamic 4-Theme Engine**:
   - Custom CSS design system in [`src/pages/tui-dashboard.css`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/pages/tui-dashboard.css) utilizing the `fci-` class namespace.
   - Core visual tokens: pure black background (`#000000`), muted blue borders (`#3a6ea5`), amber top-floating box labels (`#e8a020`), off-white body text (`#dcdcdc`), and monospace font stack (`'Courier New', Courier, monospace`).
   - Supports 4 switchable color themes (`default`, `beige`, `mono`, `navy`) managed by Zustand ([`src/store/themeStore.ts`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/store/themeStore.ts)) and synchronized to the root element's `data-theme` attribute.
   - Programmatic theme colors for Recharts time-series graphs and Xterm.js terminal sessions are mapped via [`DASH_COLORS`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/lib/tui-theme.ts).

4. **Dual-Mode Interactive Terminal Emulator**:
   - Serial console built with Xterm.js (`@xterm/xterm`, `@xterm/addon-fit`, `ResizeObserver`) in [`TerminalView.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/components/terminal/TerminalView.tsx).
   - **Mock Shell Mode**: Executes commands via [`mockShell.ts`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/components/terminal/mockShell.ts) (`help`, `ls`, `uname -a`, `df -h`, `free -m`, `uptime`, `clear`).
   - **Real WebSocket Mode**: Managed by [`TerminalWebSocket`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/lib/websocket.ts) connecting to `ws://<host>/ws/terminal/:vmId`. Features exponential backoff retries (max 3 retries), connection state indicators, and automatic fallback to mock shell mode upon retry exhaustion. Gated by `VITE_ENABLE_REAL_TERMINAL`.

5. **Database SQL Editor & Multi-Format Data Importer**:
   - Embedded `@monaco-editor/react` editor in [`SqlEditor.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/components/editor/SqlEditor.tsx) with custom syntax theme `fci-sql-dark`.
   - SQL query result sets rendered in [`QueryResultPanel.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/components/database/QueryResultPanel.tsx) using TanStack Table.
   - Drag-and-drop file uploader [`DataImportPanel.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/components/database/DataImportPanel.tsx) supporting CSV, JSON, and SQL file previewing via [`fileParser.ts`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/utils/fileParser.ts) and schema/size validation via [`fileValidator.ts`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/utils/fileValidator.ts).

6. **Single-Scroll Tabular Data Engine (`DataTable.tsx`)**:
   - Generic table component [`DataTable.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/DataTable.tsx) wrapping `@tanstack/react-table`.
   - Features 2-state ▲/▼ column sorting (`getSortedRowModel`), table global filtering (`getFilteredRowModel`), selected row highlighting, and custom action delegates (`renderActions`).
   - Displays all items in a single view with vertical scrolling via `.fci-itemslist` under `.fci-itemsbox`, eliminating pagination overhead.
   - Column definitions ([`src/features/dashboard/columns.ts`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/columns.ts)) provide service-tailored header sets for VM, Database, IAM, Network, Storage, Load Balancer, and Kubernetes.

7. **WAI-ARIA Accessibility & Focus Trapping**:
   - Custom dropdowns ([`RegionSelector.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/RegionSelector.tsx), [`ProfileMenu.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/ProfileMenu.tsx), [`ServiceSearchGrid.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/ServiceSearchGrid.tsx)) implement full WAI-ARIA `listbox`, `menu`, and `combobox` patterns with arrow key navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Escape`).
   - Portal modals ([`DashboardModal.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/DashboardModal.tsx), [`CommandPalette.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/CommandPalette.tsx)) feature document-level focus trapping and `invokerRef` focus restoration upon closing.
   - Verified automated zero-violation accessibility checks using `vitest-axe` ([`DataTable.a11y.test.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/__tests__/DataTable.a11y.test.tsx), [`DashboardModal.a11y.test.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/__tests__/DashboardModal.a11y.test.tsx), etc.).

8. **OIDC Authentik Authentication & Request Interception**:
   - OIDC integration managed by `react-oidc-context` in [`src/lib/oidc.ts`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/lib/oidc.ts).
   - Unauthenticated access is blocked by [`ProtectedRoute.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/components/auth/ProtectedRoute.tsx), redirecting to [`LoginPage.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/pages/LoginPage.tsx) while preserving destination parameters.
   - [`AuthTokenSync.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/components/auth/AuthTokenSync.tsx) listens to active authentication state and automatically injects `Authorization: Bearer <token>` headers into centralized Axios requests ([`src/lib/axios.ts`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/lib/axios.ts)).

9. **Toast Notifications & Keyboard Shortcut System**:
   - Mutation notifications managed by Zustand store [`toastStore.ts`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/store/toastStore.ts) and rendered via React Portal in [`Toast.tsx`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/Toast.tsx) (`role="alert"`, `aria-live="assertive"`, 3000ms auto-dismiss).
   - Keyboard listener [`useKeyboardShortcuts.ts`](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/hooks/useKeyboardShortcuts.ts) handles `/` or `a` to open command palette, `Ctrl+S` search focus, `Ctrl+C` copy row name, `Ctrl+D` delete confirmation, `Ctrl+I` Info tab navigation, and single-key hotkeys (`v`, `d`, `i`, `n`, `s`, `l`, `k`).

---

## Tech Stack & Dependencies

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework & Build** | Vite, React 18, TypeScript (Strict Mode) | Lightning-fast HMR and bundle compilation |
| **Routing** | React Router DOM v6 | Flat service routing, code-splitting with `React.lazy()` & `<Suspense>` |
| **Server State** | TanStack Query v5 (`@tanstack/react-query`) | Query caching, invalidation, mutation lifecycle |
| **Client UI State** | Zustand | Light-weight state stores for theme selection and toast queue |
| **Tabular Data** | TanStack Table v8 (`@tanstack/react-table`) | High-performance sorting, filtering, single-scroll tables |
| **Terminal Emulator** | Xterm.js (`@xterm/xterm`, `@xterm/addon-fit`) | Canvas-based serial terminal emulator with auto-resize |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | Full SQL editor with custom dark TUI syntax highlighting |
| **Metrics & Charts** | Recharts | Responsive time-series CPU, RAM, Disk, and Network IO visualizations |
| **API Mocking & HTTP**| MSW (Mock Service Worker), Axios | In-browser HTTP interception with Faker-seeded datasets |
| **Authentication** | `react-oidc-context` (OIDC / OAuth2) | Authentik integration with automatic token sync |
| **Testing & Linting** | Vitest, Testing Library, `vitest-axe`, Oxlint | Integration tests, automated ARIA accessibility tests, fast linter |
| **Styling** | Vanilla CSS (`tui-dashboard.css`), Tailwind CSS | Custom TUI CSS variable design tokens and layout utility |

---

## Supported Cloud Services

FCI provides dedicated workspace views, live metrics, tabbed operations, and settings for 7 cloud domains:

1. **Virtual Machines (VM)**: Instance lifecycle management (launch, stop, reboot, delete), real-time resource usage metrics (CPU, Memory, Disk IO, Network IO), inline Xterm.js console, standalone full-screen terminal, and VM settings.
2. **Database (DB)**: PostgreSQL/MySQL/Redis database instance management, active connection parameters, automated backups, Monaco SQL code editor, drag-and-drop CSV/JSON/SQL file importer, metrics, and database settings.
3. **IAM (Identity & Access Management)**: User management, role assignment, granular policy matrix, MFA status tracking, activity audit trail, and security settings.
4. **Storage (Object Storage)**: S3-compatible bucket creation, object file browser, file upload simulation, access policies, byte usage formatting, metric charts, and bucket settings.
5. **Network (VPC & Security)**: Virtual Private Cloud management, subnets, nested firewall security rules with ALLOW/DENY status pills, routing tables, VPC peering connections, CIDR validation, and network settings.
6. **Load Balancer (LB)**: Target groups, health check rules, and listener configuration (Coming Soon workspace).
7. **Kubernetes (K8s)**: Container cluster monitoring, pod deployment status, and node pool controls (Coming Soon workspace).

---

## Project Structure & File Map

```text
src/
├── app/
│   ├── providers.tsx               # QueryClientProvider, AuthProvider, ThemeProvider wrappers
│   ├── router.tsx                  # React Router routes (/dashboard, /services/:serviceId/:tab, etc.)
│   └── UiPreview.tsx               # Legacy component UI sandbox route (/ui-preview)
├── components/
│   ├── auth/
│   │   ├── AuthTokenSync.tsx       # Syncs OIDC auth token with Axios request headers
│   │   └── ProtectedRoute.tsx      # Route guard enforcing authentication
│   ├── database/
│   │   ├── DataImportPanel.tsx     # Drag-and-drop file upload & preview component
│   │   └── QueryResultPanel.tsx    # TanStack table component for SQL query execution results
│   ├── editor/
│   │   └── SqlEditor.tsx           # Lazy-loaded Monaco SQL editor with custom fci-sql-dark theme
│   ├── terminal/
│   │   ├── TerminalView.tsx        # Xterm.js canvas wrapper supporting WebSocket & mock modes
│   │   └── mockShell.ts            # Fake shell command interpreter (ls, uname, df, free, etc.)
│   └── ui/                         # Legacy Tailwind UI primitives (Panel, Button, StatusBadge)
├── features/
│   ├── dashboard/
│   │   ├── actions/                # Per-service table row action components (VmRowActions, etc.)
│   │   ├── tabs/                   # Tab content components (VmTabContent, DatabaseTabContent, etc.)
│   │   ├── columns.ts              # @tanstack/react-table column definitions per service
│   │   ├── CommandPalette.tsx      # WAI-ARIA accessible global command palette modal
│   │   ├── DashboardLoading.tsx    # Blinking TUI skeleton loading indicator
│   │   ├── DashboardModal.tsx      # Accessible portal modal with focus trap & restoration
│   │   ├── DashboardOverview.tsx   # Overview summary page (/dashboard grid)
│   │   ├── DataTable.tsx           # Reusable single-scroll @tanstack/react-table component
│   │   ├── GlobalSearchOverlay.tsx # Cross-service search result overlay dropdown
│   │   ├── TopBar.tsx              # Dashboard control bar (service switcher, search, profile, region)
│   │   └── Toast.tsx               # Self-contained toast notification component & portal container
│   ├── database/                   # Database data layer (api.ts, hooks.ts, types.ts, pages, sections)
│   ├── iam/                        # IAM data layer (api.ts, hooks.ts, types.ts)
│   ├── network/                    # Network data layer (api.ts, hooks.ts, types.ts)
│   ├── storage/                    # Storage data layer (api.ts, hooks.ts, types.ts)
│   └── vm/                         # VM data layer (api.ts, hooks.ts, types.ts, pages)
├── hooks/
│   ├── useGlobalSearch.ts          # Unified client-side cross-service search hook
│   ├── useIsMobile.ts              # Responsive viewport breakpoint detection hook
│   └── useKeyboardShortcuts.ts     # Global keyboard shortcut binding listener
├── lib/
│   ├── axios.ts                    # Centralized Axios instance with auth interceptors
│   ├── mockServiceData.ts          # Default service status codes, colors, and dataset types
│   ├── oidc.ts                     # OIDC client configuration helper
│   ├── tui-theme.ts                # Theme token color mapping constants (DASH_COLORS)
│   └── websocket.ts                # Resilient WebSocket connection manager with backoff retries
├── mocks/
│   ├── browser.ts                  # MSW worker initialization
│   ├── data/                       # In-memory stores seeded with Faker data
│   └── handlers/                   # Service MSW endpoints & generic handler factories (utils.ts)
├── pages/
│   ├── DashboardPage.tsx           # Main single-page TUI dashboard container
│   ├── ErrorPage.tsx               # React Router error boundary view
│   ├── LoginPage.tsx               # TUI login view for OIDC authentication
│   ├── NotFoundPage.tsx            # Retro TUI 404 page
│   ├── StandaloneConsolePage.tsx   # Dedicated full-screen VM serial terminal view
│   └── tui-dashboard.css           # Core FCI design system styles & theme tokens
├── store/
│   ├── themeStore.ts               # Zustand store managing theme selection (default, beige, mono, navy)
│   └── toastStore.ts               # Zustand store managing toast notifications
└── utils/
    ├── fileParser.ts               # Async parser for CSV, JSON, and SQL file previewing
    └── fileValidator.ts            # File import validation utilities
```

---

## Detailed PR Implementation Log (PRs #1–#41)

### Sprint 1 & 2 — Architecture, Design System & Virtual Machine Subsystem

#### PR #1 — `chore: project setup, router & base dependencies`
- **File Changes**: `package.json`, `src/main.tsx`, `src/app/router.tsx`, `src/app/providers.tsx`.
- **Details**: Initialized React 18 with Vite, TypeScript in strict mode, and React Router v6. Configured `QueryClientProvider` and root navigation skeleton.

#### PR #2 — `feat: TUI design system & main dashboard grid layout`
- **File Changes**: `src/pages/tui-dashboard.css`, `src/pages/DashboardPage.tsx`.
- **Details**: Established core TUI CSS properties (`--dash-*`) under `.fci-` namespace. Created dark terminal layout featuring top service buttons, items list box, detail panel, and monospace fonts.

#### PR #3 — `feat: dynamic theme engine with Zustand`
- **File Changes**: `src/store/themeStore.ts`, `src/components/ThemeSwitcher.tsx`.
- **Details**: Created Zustand theme store managing 4 themes (`default`, `beige`, `mono`, `navy`), syncing active selection directly to document root `data-theme`.

#### PR #4 — `feat: VM data layer & MSW mock REST API`
- **File Changes**: `src/mocks/data/vms.ts`, `src/mocks/handlers/vm.ts`, `src/features/vm/types.ts`, `src/features/vm/api.ts`, `src/features/vm/hooks.ts`.
- **Details**: Built Faker-seeded in-memory VM store supporting stateful REST endpoints (`GET/POST/PATCH/DELETE /api/vms`) with simulated network delay.

#### PR #5 — `feat: wire VM items table and detail panel`
- **File Changes**: `src/pages/DashboardPage.tsx`.
- **Details**: Wired `useVms` hook to the dashboard items list. Enabled row selection updating the right-hand detail panel with active instance properties.

#### PR #6 — `feat: VM instance mutations (launch, stop, reboot, delete)`
- **File Changes**: `src/features/vm/hooks.ts`, `src/pages/DashboardPage.tsx`.
- **Details**: Integrated status lifecycle mutations (`useUpdateVm`, `useDeleteVm`, `useCreateVm`) into context menus and action buttons.

#### PR #7 — `feat: VM metrics visualization with Recharts & AsciiProgressBar`
- **File Changes**: `src/components/ui/AsciiProgressBar.tsx`, `src/features/dashboard/tabs/VmMetricsTab.tsx`.
- **Details**: Created ASCII progress bar component (█ filled, ░ empty) and integrated Recharts `LineChart` graphing CPU, RAM, Disk, and Network IO across customizable time ranges.

#### PR #8 — `feat: interactive Xterm.js serial terminal emulator`
- **File Changes**: `src/components/terminal/TerminalView.tsx`, `src/components/terminal/mockShell.ts`.
- **Details**: Built `@xterm/xterm` canvas wrapper with `@xterm/addon-fit` and `ResizeObserver`. Created interactive `mockShell` executing shell commands (`ls`, `uname -a`, `df -h`, `free -m`, `uptime`, `clear`).

#### PR #9 — `feat: VM instance creation form and standalone detail view`
- **File Changes**: `src/features/vm/pages/VmCreateForm.tsx`, `src/features/vm/pages/VmDetailPage.tsx`, `src/pages/StandaloneConsolePage.tsx`.
- **Details**: Created inline creation form `VmCreateForm.tsx`, dedicated instance view `VmDetailPage.tsx` (`/services/vm/instances/:id`), and standalone console view `StandaloneConsolePage.tsx`.

#### PR #10 — `refactor: extract TabContent into per-service components`
- **File Changes**: `src/features/dashboard/tabs/` (`VmTabContent.tsx`, `DatabaseTabContent.tsx`, `IamTabContent.tsx`, `NetworkTabContent.tsx`, `StorageTabContent.tsx`).
- **Details**: Refactored monolithic tab section into clean per-service tab components.

#### PR #11–#14 — `feat: VM tab wiring, metrics refinement, and console integration`
- **File Changes**: `src/features/dashboard/tabs/VmTabContent.tsx`, `src/features/vm/hooks.ts`.
- **Details**: Finalized VM sub-tabs (Console, Storage, Network, Backups, Metrics), wired live time-range selectors (`30m`, `1h`, `3h`, `1w`), and bound terminal sessions to active VM instances.

---

### Sprint 3 — Database, IAM, Storage & Network Service Data Layers

#### PR #15 & #16 — `feat: Database service — data layer, MSW API & live tab wiring`
- **File Changes**: `src/mocks/data/databases.ts`, `src/mocks/handlers/database.ts`, `src/features/database/` (`types.ts`, `api.ts`, `hooks.ts`, `pages/DatabaseCreateForm.tsx`).
- **Details**: Built database store supporting PostgreSQL, MySQL, and Redis engines. Implemented endpoints (`/api/databases`) and React Query hooks (`useDatabases`, `useCreateDatabase`, `useDeleteDatabase`). Wired Info, Details, Metrics, Backups, Connections, SQL Editor, and Data Import tabs.

#### PR #17 — `feat: SQL Editor with Monaco & CSV/JSON/SQL file import engine`
- **File Changes**: `src/components/editor/SqlEditor.tsx`, `src/components/database/QueryResultPanel.tsx`, `src/components/database/DataImportPanel.tsx`, `src/utils/fileParser.ts`, `src/utils/fileValidator.ts`.
- **Details**: Embedded Monaco Editor with custom dark TUI theme (`fci-sql-dark`). Built TanStack Table query result viewer and drag-and-drop file import engine with client-side parsing and schema validation.

#### PR #18 & #19 — `feat: IAM service — data layer, MSW API & live tab wiring`
- **File Changes**: `src/mocks/data/iam.ts`, `src/mocks/handlers/iam.ts`, `src/features/iam/` (`types.ts`, `api.ts`, `hooks.ts`), `src/features/dashboard/tabs/IamTabContent.tsx`.
- **Details**: Built IAM user, role, and policy data structures. Added MSW endpoints (`/api/iam/users`, `/api/iam/roles`, `/api/iam/policies`) and wired Permissions matrix, Policies grid, and Activity audit log.

#### PR #20 & #21 — `feat: Storage service — data layer, MSW API & live tab wiring`
- **File Changes**: `src/mocks/data/storage.ts`, `src/mocks/handlers/storage.ts`, `src/features/storage/` (`types.ts`, `api.ts`, `hooks.ts`), `src/features/dashboard/tabs/StorageTabContent.tsx`.
- **Details**: Built S3-compatible bucket and object browser data layer. Implemented bucket creation, file upload simulation, policy updates, byte size formatting (`KB`, `MB`, `GB`), and metrics.

#### PR #22 & #23 — `feat: Network service — data layer, MSW API & live tab wiring`
- **File Changes**: `src/mocks/data/network.ts`, `src/mocks/handlers/network.ts`, `src/features/network/` (`types.ts`, `api.ts`, `hooks.ts`), `src/features/dashboard/tabs/NetworkTabContent.tsx`.
- **Details**: Created VPC, subnet, firewall security rule, route table, and VPC peering data layer. Added color-coded `ALLOW` (green) / `DENY` (red) status pills and IPv4 CIDR validation.

---

### Sprint 4 — Polish, Auth, Styling Consolidation & Table Migration

#### PR #24 — `fix: consolidate dual styling system and remove dead code`
- **File Changes**: Deleted `src/App.tsx`, updated `src/lib/tui-theme.ts`, `src/features/vm/pages/VmDetailPage.tsx`, annotated `src/components/ui/`.
- **Details**: Removed dead wrapper `App.tsx`. Added `DASH_COLORS` theme constants for Recharts/Xterm. Migrated `VmDetailPage.tsx` to pure `fci-` CSS layout with theme support and expanded metadata.

#### PR #25 — `feat: toast/notification system for mutations`
- **File Changes**: `src/store/toastStore.ts`, `src/features/dashboard/Toast.tsx`, `src/pages/tui-dashboard.css`.
- **Details**: Created Zustand `toastStore.ts` and accessible portal container `Toast.tsx` (`role="alert"`, `aria-live="assertive"`, 3000ms auto-dismiss). Added slide-in CSS keyframe animations and integrated toast feedback across all forms and modal actions.

#### PR #26 — `feat: Dashboard responsive layout (mobile/tablet)`
- **File Changes**: `src/features/dashboard/TopBar.tsx`, `src/hooks/useIsMobile.ts`, `src/pages/tui-dashboard.css`.
- **Details**: Standardized header action bar height (38px). Replaced emojis with uniform 18x18px SVG service icons. Optimized mobile sticky search overlay, full-screen mobile terminal/SQL modal, and responsive instance detail expansion.

#### PR #27 — `feat: global command palette & updated keyboard shortcuts`
- **File Changes**: `src/hooks/useKeyboardShortcuts.ts`, `src/features/dashboard/CommandPalette.tsx`.
- **Details**: Built keyboard listener `useKeyboardShortcuts.ts` (`/` or `a` command palette, `Ctrl+S` search, `Ctrl+C` copy row name, `Ctrl+D` delete confirmation, `Ctrl+I` Info tab, single-key service hotkeys). Built Spotlight-style `CommandPalette.tsx` portal with prefix execution (`:vm`, `:db`, `:iam`, `:net`, `:str`).

#### PR #28 — `feat: OIDC auth integration (Authentik) and protected routes`
- **File Changes**: `src/lib/oidc.ts`, `src/app/providers.tsx`, `src/components/auth/AuthTokenSync.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/pages/LoginPage.tsx`.
- **Details**: Integrated `react-oidc-context`, `ProtectedRoute.tsx`, centered TUI view `LoginPage.tsx`, and automatic Bearer token injection into Axios requests via `AuthTokenSync.tsx`.

#### PR #29 — `feat: error boundary, 404 page, global loading skeleton`
- **File Changes**: `src/pages/NotFoundPage.tsx`, `src/pages/ErrorPage.tsx`, `src/features/dashboard/DashboardLoading.tsx`.
- **Details**: Created retro TUI 404 view `NotFoundPage.tsx`, React Router error boundary `ErrorPage.tsx` with dev stack traces, and blinking skeleton indicator `DashboardLoading.tsx`.

#### PR #30 — `feat: Dashboard overview/home page with cross-service summary`
- **File Changes**: `src/features/dashboard/DashboardOverview.tsx`, `src/features/dashboard/icons.tsx`.
- **Details**: Built `/dashboard` overview page featuring 5 service cards with live resource counts, status breakdowns, last-created resource timestamps, recent activity log, and system status health panel.

#### PR #31 — `feat: @tanstack/react-table migration for items table`
- **File Changes**: `src/features/dashboard/DataTable.tsx`, `src/features/dashboard/columns.ts`, deleted `useSortableRows.ts` & `SortableHeader.tsx`.
- **Details**: Migrated items table to generic `@tanstack/react-table` wrapper `DataTable.tsx`. Added 2-state ▲/▼ column sorting, table global filtering, selected row highlighting, and service-tailored column definitions.

---

### Sprint 5 — Refactoring, Accessibility, Tests & Production Deployment

#### PR #32 — `feat: WebSocket connection layer for real terminal`
- **File Changes**: `src/lib/websocket.ts`, `src/components/terminal/TerminalView.tsx`, `src/features/dashboard/tabs/VmTabContent.tsx`.
- **Details**: Created `TerminalWebSocket` client handling real-time WebSocket connections (`ws://<host>/ws/terminal/:vmId`) with exponential backoff retries (max 3 retries), retry exhaustion events, and fallback to mock shell mode. Gated by `VITE_ENABLE_REAL_TERMINAL`.

#### PR #33 — `chore: code-splitting, lazy routes, production build optimization`
- **File Changes**: `src/app/router.tsx`, `vite.config.ts`, `src/features/dashboard/tabs/`.
- **Details**: Code-split route pages using `React.lazy()` & `<Suspense>`. Deferred loading for Monaco and Xterm bundles. Configured Vite rollup chunk splitting (`vendor-react`, `vendor-query`, `vendor-charts`, `vendor-terminal`).

#### PR #34 — `test: MSW integration tests for critical flows`
- **File Changes**: `src/features/*/__tests__/` (`vm.test.tsx`, `database.test.tsx`, `iam.test.tsx`, `network.test.tsx`, `storage.test.tsx`).
- **Details**: Created stateful MSW integration test suite verifying list fetching, creation, mutation cache invalidation, deletion, and metric series handling across all services.

#### PR #35 — `chore: Docker build, env config, deployment readiness`
- **File Changes**: `Dockerfile`, `nginx.conf`, `.env.example`, `README.md`.
- **Details**: Added multi-stage production `Dockerfile` (`node:20-alpine AS build` -> `nginx:alpine`), `nginx.conf` SPA fallback & reverse proxy setup, environment variable references, and deployment documentation.

#### PR #36 — `refactor: decompose monolithic DashboardPage.tsx`
- **File Changes**: `src/pages/DashboardPage.tsx`, `src/features/dashboard/actions/`, `src/features/dashboard/DetailPanel.tsx`, `src/features/dashboard/TopBar.tsx`, `src/features/dashboard/useDashboardModals.ts`.
- **Details**: Reduced `DashboardPage.tsx` size from ~2,350 lines down to ~798 lines by extracting per-service row actions, detail panel, top control bar, profile menu, region selector, search grid, and modal management hook.

#### PR #37 — `feat: accessibility pass — ARIA roles, keyboard navigation, automated a11y checks`
- **File Changes**: `RegionSelector.tsx`, `ProfileMenu.tsx`, `ServiceSearchGrid.tsx`, `DataTable.tsx`, `DashboardModal.tsx`, `CommandPalette.tsx`, `setup.ts`, `vitest-axe.d.ts`, `*.a11y.test.tsx`.
- **Details**: Upgraded custom dropdowns to full WAI-ARIA `listbox`, `menu`, and `combobox` patterns with arrow key navigation. Added dynamic sort button `aria-label`s and `scope="col"` to tables. Added focus traps and focus restoration to modals. Installed `vitest-axe` and enabled oxlint `jsx-a11y` rules.

#### PR #38 — `feat: global cross-service search and command palette integration`
- **File Changes**: `src/hooks/useGlobalSearch.ts`, `src/features/dashboard/GlobalSearchOverlay.tsx`, `src/features/dashboard/CommandPalette.tsx`.
- **Details**: Built unified client-side search hook filtering resources across VMs, Databases, IAM Users, Buckets, and Networks by name, ID, status, region, or engine. Integrated real-time search overlay into top search input and synced with command palette shortcode prefixes.

#### PR #39 — `feat: service settings views with retro TUI styling`
- **File Changes**: `src/features/*/pages/*SettingsPage.tsx`, `src/mocks/handlers/`.
- **Details**: Built retro TUI settings pages for all 5 primary services (`VmSettingsPage`, `DatabaseSettingsPage`, etc.) with MSW PATCH persistence and toast notifications. Wired top control bar and mobile menu gear buttons (`⚙`) to navigate to `/services/:serviceId/settings`.

#### PR #40 — `refactor: abstract repetitive MSW mock handlers`
- **File Changes**: `src/mocks/handlers/utils.ts`, `src/mocks/handlers/` (`vm.ts`, `database.ts`, `iam.ts`, `storage.ts`, `network.ts`).
- **Details**: Created generic MSW handler factory functions (`createGetByIdHandler`, `createDeleteHandler`, `createSettingsPatchHandler`), eliminating ~250 lines of duplicate route boilerplate across service mocks.

#### PR #41 — `feat: new service options, responsive refinements & pagination removal`
- **File Changes**: `src/features/dashboard/constants.ts`, `src/features/dashboard/TopBar.tsx`, `src/features/dashboard/DataTable.tsx`, `src/pages/tui-dashboard.css`.
- **Details**: Added Load Balancer (`:lb`, hotkey `l`) and Kubernetes (`:k8s`, hotkey `k`) workspaces and icons. Repositioned parenthesis shortcode key labels to the bottom-right border notch. Responsive layout refinements: hidden box labels `<=1450px`, hidden key labels `<=1000px`. Completely removed table pagination controls in favor of a clean single-view vertical scrolling list.

---

## Development Setup & Workflow

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v9.0.0 or higher

### Local Development

1. **Clone the repository and install dependencies**:
   ```bash
   git clone https://github.com/freecloudinitiative/frontend.git
   cd frontend
   npm install
   ```

2. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   The application will start at `http://localhost:5173`. MSW automatically intercepts all network calls in development.

3. **Useful Scripts**:
   ```bash
   npm run build   # Run TypeScript typechecks & build production bundle
   npx oxlint .    # Run fast Oxlint static analysis
   npm test        # Run Vitest test suite (unit, integration, and accessibility tests)
   ```

---

## Environment Variables

Copy `.env.example` to `.env` to customize local environment behavior.

### Build-time Variables (`VITE_*`)

| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for the backend API endpoint. | `""` (Same-origin, required for MSW) |
| `VITE_OIDC_AUTHORITY` | Authentik / OIDC Provider issuer URL. Unset disables auth. | Unset (Auth disabled pass-through) |
| `VITE_OIDC_CLIENT_ID` | OIDC Client Identifier registered with IdP. | Unset |
| `VITE_OIDC_REDIRECT_URI`| OIDC OAuth callback URI. | `${origin}/callback` |
| `VITE_WS_BASE_URL` | WebSocket URL for real serial terminal connection. | `ws://localhost:8080` |
| `VITE_ENABLE_REAL_TERMINAL` | Enable real WebSocket terminal (`true`) or mock shell (`false`). | `false` |

### Container Runtime Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `API_BACKEND_URL` | Origin backend server address reverse-proxied by Nginx for `/api/`. | `http://backend:8080` |

---

## Docker & Container Deployment

### 1. Build Production Image

Build the multi-stage Docker image, passing required build arguments:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.cloud.example.com \
  --build-arg VITE_OIDC_AUTHORITY=https://auth.example.com/application/o/fci/ \
  --build-arg VITE_OIDC_CLIENT_ID=fci-dashboard-client \
  --build-arg VITE_OIDC_REDIRECT_URI=https://console.example.com/callback \
  --build-arg VITE_WS_BASE_URL=wss://ws.example.com \
  --build-arg VITE_ENABLE_REAL_TERMINAL=true \
  -t fci-frontend .
```

### 2. Run Container with Proxy Network

Launch the Nginx container, passing runtime environment variables and attaching to the backend network:

```bash
# Create shared container network
docker network create fci-net

# Run frontend container
docker run -d \
  --name fci-dashboard \
  -p 8080:80 \
  --network fci-net \
  -e API_BACKEND_URL=http://backend-service:8080 \
  fci-frontend
```

The application serves at `http://localhost:8080`. Nginx handles SPA client routing (redirecting non-static routes to `index.html`), serves static assets with 1-year immutable caching, and proxies all `/api/` HTTP traffic directly to `${API_BACKEND_URL}`.
