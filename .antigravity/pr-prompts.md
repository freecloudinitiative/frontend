# TUI Cloud Dashboard — Claude Code Prompts (35 PRs)

This document turns the sprint-based PR plan into ready-to-paste prompts for Claude Code. Give Claude Code **one prompt per PR**, in order, review the diff, run/test it, commit, then move to the next. Don't batch multiple PRs into one prompt — the whole point of the plan is small, reviewable units.

## How to use this

1. Claude Code reads `CLAUDE.md` at your repo root automatically at the start of every session, so you don't need to repeat the design system or stack in every prompt.
2. For each PR, copy the prompt from the matching section into Claude Code.
3. After Claude Code finishes a PR, actually check the acceptance criteria yourself before starting the next prompt — several later PRs assume earlier ones are truly done.
4. If Claude Code drifts from the TUI aesthetic or the folder structure, point it back at `CLAUDE.md` rather than re-explaining from scratch.

---

# 🟢 COMPLETED TECHNICAL ARCHITECTURE & STATE — Sprint 1–4 (PRs #1–#29)

> **Sprints 1 through 3 and PRs #24–#29 are fully completed.** The core architecture, styling system, MSW mock API data layer, interactive VM management, Recharts metric visualizations, interactive Xterm.js serial terminal emulator, Database service (Monaco SQL editor, data import), IAM service (data layer, live tabs, Zustand store), Storage service (buckets, file browser, metrics), Network service (nested firewall rules, routes, VPC peerings, IPv4 CIDR validation, standardized table layouts), dual styling system consolidation & dead code removal (`PR #24`), Toast/Notification System for Mutations (`PR #25`), Dashboard responsive layout & mobile/tablet UI restructuring (`PR #26`), Global Command Palette & updated keyboard shortcuts (`PR #27`), OIDC auth integration (Authentik) & protected routes (`PR #28`), and Error Boundary, 404 page & global loading skeleton (`PR #29`) are implemented and verified end-to-end.

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
│   │   ├── constants.ts            # SERVICE_TABS, SERVICE_MENUS, ROUTED_TABS, tab type definitions
│   │   ├── DashboardLoading.tsx    # Standardized blinking loading skeleton component
│   │   ├── DashboardModal.tsx      # Accessible portal modal with focus trap & focus restoration
│   │   ├── SortableHeader.tsx      # Accessible <th> header with keyboard focus & sort indicator
│   │   ├── Toast.tsx               # Self-contained toast component & container with auto-dismiss
│   │   ├── useSortableRows.ts      # Multi-column table sorting hook (none → asc → desc → none)
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
- **Global Table Standardization**: Standardized table layout across all 5 service lists with uniform `Region` (`ANK` / `IST`) placement, character-clip-free header padding (`6px 8px 8px 8px`), row top padding (`10px`), fixed 8ch ID column width, and multi-column sorting (`useSortableRows`).

---

# SPRINT 4 — Polish, Auth, Production Readiness

## Completed in Sprint 4 — Consolidate Dual Styling System & Remove Dead Code (PR #24)

### What was done (`PR #24`)

- **Dead Code Removal (`src/App.tsx`)**: Deleted `App.tsx` dead wrapper file since `main.tsx` mounts `RouterProvider` directly via `AppProviders`. Verified clean build and routing.
- **Theme Constants Consolidation (`src/lib/tui-theme.ts`)**: Replaced stale `themes`/`tuiTheme` runtime objects with `DASH_COLORS` typed constants matching `--dash-*` CSS custom properties in `tui-dashboard.css` for programmatic Recharts/Xterm theming. Retained `TuiStatus` type export for backwards compatibility with `/ui-preview`.
- **`VmDetailPage` Migration (`src/features/vm/pages/VmDetailPage.tsx`)**: Restyled the standalone VM detail view from legacy Tailwind primitives (`Panel`, `Button`, `StatusBadge`, `Modal`, `QueryState`) to pure `fci-` CSS classes, integrated `DashboardModal` for delete confirmation, wrapped page in `<div className="fci-page" data-theme={theme}>` to support all 4 themes, added a **← Back** action button, and expanded displayed VM metadata (`Region`, `OS`, `diskType`).
- **Legacy UI Primitives Annotation (`src/components/ui/`)**: Added deprecation comments to legacy UI files (`Button.tsx`, `Modal.tsx`, `Panel.tsx`, `QueryState.tsx`, `StatusBadge.tsx`) retained exclusively for the `/ui-preview` route.
- **Cleanup Stale Placeholders (`.gitkeep`)**: Removed `.gitkeep` files from non-empty directories (`mocks/`, `features/`, `components/terminal/`).

---

## Completed in Sprint 4 — Toast/Notification System for Mutations (PR #25)

### What was done (`PR #25`)

- **Toast Store (`src/store/toastStore.ts`)**: Built a Zustand store managing `toasts: Toast[]` state with auto-generated unique IDs, custom or 3000ms default auto-dismiss durations, and `addToast` / `removeToast` actions.
- **Toast Component & Container (`src/features/dashboard/Toast.tsx`)**: Created self-contained `ToastContainer` and `ToastItem` components rendered via React Portal in a fixed viewport position (bottom-right `bottom: 60px; right: 20px; z-index: 600`, positioned above modal overlay layer `z-index: 500`) with ARIA accessibility tags (`role="alert"`, `aria-live="assertive"`).
- **CSS Styling & Slide-In Animation (`src/pages/tui-dashboard.css`)**: Styled under `.fci-toast*` class namespace with monospace typography, smooth right slide-in keyframe animations (`@keyframes fci-toast-slide-in`), and left border variants: success (`#7ec87e`), error (`#e0546a`), and info (`#4fa8dc`).
- **Dashboard & Form Integration (`src/pages/DashboardPage.tsx`, Create Forms)**: Replaced inline success/error text with `addToast` calls across `VmCreateForm`, `DatabaseCreateForm`, `IamCreateForm`, `BucketCreateForm`, `NetworkCreateForm`, `NetworkTabContent`, and all `DashboardPage` modal mutation handlers (delete, stop, reboot, role edit, revoke access).
- **Dynamic Theme Tokens & Modal UI Refinement (`DashboardModal.tsx`, `tui-dashboard.css`)**: Enhanced `DashboardModal` container with rounded borders (`border-radius: 6px`), visual separation (`box-shadow`), backdrop overlay blur (`backdrop-filter: blur(4px)`), themed close button `[✕]`, and mapped all overlay/container/button colors to CSS custom properties (`--dash-modal-*`) across `default`, `mono`, `navy`, and `beige` themes.
- **Automated Vitest Coverage** (`src/**/__tests__/**`): Added unit and integration suites (`toastStore.test.ts`, `Toast.test.tsx`, `VmCreateForm.test.tsx`, `DatabaseCreateForm.test.tsx`, `IamCreateForm.test.tsx`, `NetworkCreateForm.test.tsx`, `BucketCreateForm.test.tsx`). Verified 100% test pass rate (542/542 tests) and clean `npm run build`.

---

## Completed in Sprint 4 — Dashboard responsive layout (mobile/tablet) (PR #26)

### What was done (`PR #26`)

- **Responsive Header & Top Action Controls (`DashboardPage.tsx`, `tui-dashboard.css`)**: Restructured Header Row 1 actions into sequence: `Create` (`+`) → `Connect` (`▶`) → `Delete` (`✕`) → `Refresh` (`↻`) → `Setting` (`⚙`) → `Region` → `Profile` (far right). Standardized vertical height (38px) and style to match desktop Region and Profile components.
- **Service Navigation Controls**: Replaced emojis with SVG vector icons (`VmIcon`, `DatabaseIcon`, `IamIcon`, `StorageIcon`, `NetworkIcon`) sharing uniform 18×18px bounding box dimensions and added active touch feedback (`:active` depth effect).
- **Footer Clean-up & Profile Menu Relocation**: Pinned Search bar to sticky bottom (`bottom: 0; z-index: 100`). Completely hid bottom shortcuts, links, and ThemeSwitcher on mobile (`display: none !important`). Relocated circular color-swatch Theme options (`Default`, `Amber`, `Mono`, `Navy`) and external integration links (`About Creator`, `Docs`, `Grafana`, `Prometheus`, `Loki`, `Chaos Demo`, `Architecture`) into Profile dropdown menu with touch/click propagation handlers.
- **Instance Selection Viewport Replacement & Service Switch Reset**: Selecting a row hides `.fci-itemsbox` and expands `.fci-detail-panel` to 100% main content area. Added standardized icon-only `<<` Back button floating border-notch control returning users to list view. Switching services automatically resets the viewport to the Instance List view.
- **Mobile Search Focus Overlay & Keyboard Docking**: Added background blur backdrop overlay (`backdrop-filter: blur(8px)`), virtual keyboard docking (`env(keyboard-inset-height)`), and an auto-expanding search results container directly above the search bar.
- **Terminal & Query Interface Blur Gate & 100vh Full-Screen Modal**: Blurred inactive preview gate for VM Terminal and DB SQL Editor on mobile with prominent **▶ Connect** CTA overlay. Tapping **▶ Connect** launches a dedicated 100vh full-screen modal view (`.fci-mobile-fullscreen-modal`) with a prominent `✕ Exit` button.
- **Create Screen Mobile Layout Fixes**: Vertical stacking (`flex-direction: column`) with visible horizontal section separator between form fields and Info panel, plus top clearance for floating border-notch control.
- **Intermediate Responsive Breakpoint Refinements (`769px` – `1450px`)**:
  - **Theme Controls & Links Relocation (`<= 1450px`)**: Automatically hide bottom theme selector buttons (`.fci-theme-switcher`), external utility links (`.fci-footer-links`), and the redundant bottom horizontal separator line (`.fci-footer { display: none !important; }`) from main interface and migrate controls into the Profile dropdown menu when viewport width is `<= 1450px`.
  - **Profile Component & Dropdown Sizing Parity (`769px` – `1450px`)**: Configured `.fci-box.fci-profile` trigger button (`min-width: 150px; height: 38px; padding: 6px 10px; box-sizing: border-box; display: inline-flex; align-items: center; position: relative;`) and `.fci-profile .fci-dd-menu` (`right: 0 !important; left: 0 !important; width: 100% !important; min-width: 100% !important; box-sizing: border-box !important;`) within `@media (min-width: 769px) and (max-width: 1450px)` to match the exact dimensions, width/padding constraints, and scaling logic as the mobile version (`max-width: 768px`), preserving default desktop sizing `> 1450px`.
  - **Mobile Header & Container Fit (`<= 768px`)**: Restored the Connect action button (`btn-mobile-run`, `▶`) across all 5 services (`VM`, `Database`, `IAM`, `Storage`, `Network`) in `DashboardPage.tsx`. Configured `.fci-topbar-actions` in `tui-dashboard.css` with `justify-content: space-between` and responsive `gap: clamp(6px, 2.5vw, 12px)` for balanced distribution. Configured `.fci-page` (`height: 100dvh; max-height: 100dvh; overflow: hidden`) and `.fci-tui` (`height: calc(100dvh - 20px)`) so the outermost container border is 100% visible on screen without requiring page scrollbars. Removed thin top border divider line (`border-top: none !important`) from `.fci-mobile-search-bar` container so it rests cleanly below main content without line artifacts.
  - **Service List & Side-Panel 50/50 Symmetric Layout (`769px` – `1450px`)**: Configured `.fci-maingrid` and `.fci-split-layout` with `grid-template-columns: repeat(2, minmax(0, 1fr))` and `margin-top: 14px` clearance so both side-by-side panels scale symmetrically with equal 50/50 width distribution. Enabled `overflow: visible !important` on `.fci-itemsbox` and `.fci-detail-panel` so top border notch elements (`.fci-box-label` and `.fci-box-keys-top`) are 100% unclipped.
- **CodeRabbit Accessibility & Performance Refinements**:
  - Unmounted background preview instances (`!fullscreenTerminal` and `!fullscreenSql`) in `VmTabContent.tsx` and `DatabaseTabContent.tsx` while full-screen modals are open to prevent dual canvas/Monaco instances and duplicate event listeners.
  - Added accessible dialog semantics (`role="dialog"`, `aria-modal="true"`, `aria-label`), Escape key listener effects, and `hideActions` prop to mobile full-screen modals.
  - Refactored `useIsMobile.ts` with module-level constants `MOBILE_MEDIA_QUERY` and `COMPACT_MEDIA_QUERY`, plus immediate `mq.matches` synchronization upon effect mount.
- **Cross-Breakpoint Scope & Test Verification**: All responsive overrides strictly target appropriate breakpoint media queries (`<= 1450px`, `769px–1450px`, `<= 768px`), keeping default full-screen desktop view (`> 1450px`) 100% untouched. Verified clean `npm run build` and `npm test -- --run` (33 test files, 544 tests passing).

---

## Completed in Sprint 4 — Global Command Palette & Updated Keyboard Shortcuts (PR #27)

### What was done (`PR #27`)

- **Keyboard Shortcuts Hook (`src/features/dashboard/useKeyboardShortcuts.ts`)**: Extracted and centralized keyboard shortcut handling with input focus guards (`INPUT`, `TEXTAREA`, `SELECT`). Supported shortcuts: `/` or `a` to open Command Palette, `Escape` to close palette/modal/dropdowns, `Ctrl+S` to focus global search, `Ctrl+C` to copy selected row name with toast feedback, `Ctrl+D` for service delete flow, `Ctrl+I` for Info tab, and single-key service navigation (`V` for VM, `D` for Database, `I` for IAM, `N` for Network, `S` for Storage). Supports `disabled` prop on mobile viewports (`width <= 768px`) to deactivate all listeners.
- **Global Command Palette (`src/features/dashboard/CommandPalette.tsx`)**: Created Spotlight-style portal overlay with blurred backdrop (`backdrop-filter: blur(8px)`), real-time command filtering, keyboard arrow navigation (`Up`/`Down`) with active item highlight and auto-scrolling into view, `Enter` execution, and command prefixes: `:vm`, `:db`, `:iam`, `:net`, `:str`, `:crt`, and `:dlt`.
- **Desktop Shortcut Menu & Labels (`DashboardPage.tsx`, `tui-dashboard.css`)**: Restored bottom shortcut hint list exclusively for desktop viewports (`> 1450px`) using standard `<b>` key styling and explicit labels: `/ search`, `(vm) Virtual Machines`, `(db) Database`, `(iam) IAM`, `(net) Network`, `(str) Storage`. Updated service box key hints to parenthesized shortcodes `(vm)`, `(db)`, `(iam)`, `(net)`, `(str)`.
- **Mobile Viewport Guard & Disabling (`DashboardPage.tsx`, `useKeyboardShortcuts.ts`)**: Deactivated all custom keyboard shortcut event listeners and prevented Command Palette modal rendering (`isOpen={!isMobile && commandPaletteOpen}`) on mobile viewports (`<= 768px`), leaving mobile input focus behavior untouched.
- **Automated Vitest Test Suites**: Created unit and accessibility test suites `CommandPalette.test.tsx` (11 tests) and `useKeyboardShortcuts.test.tsx` (9 tests) verifying portal rendering, search filtering, arrow navigation, Enter execution, Escape dismiss, input focus guards, and mobile disable mode. Verified 100% test pass rate across all 36 test files (567/567 tests passing) and clean `npm run build`.

---

## Completed in Sprint 4 — OIDC Auth Integration & Protected Routes (PR #28)

### What was done (`PR #28`)

- **OIDC Helper & Config Detection (`src/lib/oidc.ts`)**: Implemented `getOidcConfig()` and `isOidcConfigured()` to parse `VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, and `VITE_OIDC_REDIRECT_URI` (defaulting to `window.location.origin + '/callback'`). Gracefully falls back to unauthenticated pass-through mode when authority/client_id are absent.
- **Provider Wrapper & Callback Cleanup (`src/app/providers.tsx`)**: Configured `react-oidc-context`'s `AuthProvider` dynamically based on OIDC configuration state. Added `onSigninCallback` to strip OIDC state/code query parameters from the browser URL upon successful authentication. Wrapped the application with `<AuthTokenSync />` inside `AuthProvider`.
- **Axios Token Interceptor (`src/lib/axios.ts`, `src/components/auth/AuthTokenSync.tsx`)**: Added `setAuthToken(token: string | null)` export and request interceptor attaching `Authorization: Bearer <token>`. Created `AuthTokenSync` component inside `AuthProvider` to continuously keep module-level axios token state synchronized with `useAuth()` hook.
- **Protected Route Guard (`src/components/auth/ProtectedRoute.tsx`)**: Built `ProtectedRoute` component to handle unauthenticated redirection to `/login` (preserving targeted `location.pathname + location.search` in state for post-login redirect), displaying a blinking TUI loading indicator `[ AUTHENTICATING... ]` while auth state resolves, and passing through directly when OIDC is unconfigured.
- **TUI Login Page (`src/pages/LoginPage.tsx`, `src/pages/tui-dashboard.css`)**: Created centered TUI-styled Login view with `fci-login-screen` and `fci-login-panel`, displaying "Free Cloud Initiative", `[ AUTHENTICATING... ]` loading state, and `[ Sign in with Authentik ]` button invoking `auth.signinRedirect()`. Auto-redirects authenticated users to intended destination or `/dashboard`.
- **Router Wiring & Out-of-the-Box Protection (`src/app/router.tsx`)**: Added `/login` and `/callback` routes pointing to `LoginPage`, and wrapped all dashboard/service routes (`/dashboard`, `/services/*`, `/services/:serviceId/:tab`, creation/detail pages) within `ProtectedRoute`.
- **Sign Out Control (`src/pages/DashboardPage.tsx`)**: Wired Profile dropdown "Sign out" menu item to execute `auth.signoutRedirect()` when OIDC is active, or trigger an "Auth not configured" toast notice in pass-through mode.
- **Environment Template Documentation (`.env.example`)**: Added OIDC configuration section documenting `VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, and `VITE_OIDC_REDIRECT_URI`.

---

## Completed in Sprint 4 — Error Boundary, 404 Page & Global Loading Skeleton (PR #29)

### What was done (`PR #29`)

- **TUI 404 Resource Not Found Page (`src/pages/NotFoundPage.tsx`)**: Created retro TUI-styled 404 page with `fci-status-screen` layout, centered `fci-status-box`, `404` box label, `RESOURCE NOT FOUND` title, informative text, and `[ Return to Dashboard ]` navigation button.
- **React Router Error Boundary (`src/pages/ErrorPage.tsx`)**: Implemented global TUI error boundary displaying `SYSTEM ERROR` header, user-friendly fallback text, dev-mode (`import.meta.env.DEV`) stack trace output inside `fci-console-log`, and `[ Return to Dashboard ]` action button.
- **Router Error & Wildcard Catch-All Wiring (`src/app/router.tsx`)**: Configured `errorElement={<ErrorPage />}` on root router group and registered catch-all wildcard `path: '*'` route rendering `<NotFoundPage />`.
- **Global Loading Indicator (`src/features/dashboard/DashboardLoading.tsx`)**: Created reusable `DashboardLoading` component rendering blinking `[ LOADING... ]` (or custom label) powered by standard `fci-blink` CSS keyframes.
- **Loading UI Standardization (`DashboardPage.tsx`, `VmTabContent.tsx`, `DatabaseTabContent.tsx`, `StorageTabContent.tsx`)**: Unified loading states across the items table loading row and all tab metric/object views (`VmMetricsTab`, `DatabaseMetricsTab`, `ObjectsTab`, `StorageMetricsTab`) using `DashboardLoading`.
- **CSS Status Screen Utility Classes (`src/pages/tui-dashboard.css`)**: Added `.fci-status-screen`, `.fci-status-box`, `.fci-status-error`, `.fci-status-title`, `.fci-status-message`, `.fci-status-btn`, and `.fci-status-detail` design tokens for full-page status and error displays.
- **Automated Vitest Coverage**: Verified 100% test pass rate across all 36 test files (567/567 tests passing) and clean `npm run build`.

---

## PR #30 — `feat: Dashboard overview/home page with cross-service summary`

```markdown
Create a dashboard home/overview view that shows a summary across all 5 services
when no specific service is selected or when navigating to `/dashboard`.

1. Create `features/dashboard/DashboardOverview.tsx`:
   - Shows a grid of 5 summary cards (one per service), each displaying:
     - Service name and a colored indicator dot matching the service's theme
       color from `tui-dashboard.css`.
     - Resource count: "X VMs", "X Databases", "X Users", "X Networks",
       "X Buckets" — fetched live from the respective `useXxx()` hooks.
     - Status breakdown: "Y running, Z stopped" (for applicable services).
     - Last created resource name and date.
   - Below the cards, show a "Recent Activity" section with a combined,
     chronologically sorted list of recent resource changes across all services
     (keep this as realistic hardcoded data — we don't have an activity API).
   - Below that, a "System Status" section with hardcoded but realistic
     infrastructure metrics: API latency, uptime percentage, active alerts.

2. Style the overview with `fci-` CSS:
   - Summary cards use `fci-box` styling with the service's border color.
   - Layout: responsive grid that stacks on mobile.
   - Cards should be clickable — clicking a service card navigates to that
     service's details tab.

3. Update `app/router.tsx`:
   - Change `/dashboard` to render the `DashboardOverview` within the
     `DashboardPage` layout (or as a standalone page — your call based on
     what looks better). The overview should feel like part of the same app.
   - Keep the redirect from `/` → `/dashboard`.

4. Update the "Free Cloud Initiative" title in `DashboardPage` — make it a
   clickable link that navigates to `/dashboard` (the overview).

Scope: `features/dashboard/DashboardOverview.tsx`, `app/router.tsx`,
`DashboardPage.tsx`, `tui-dashboard.css`.

Acceptance criteria:

- `/dashboard` shows a summary of all 5 services with live resource counts.
- Clicking a service card navigates to that service.
- The overview matches the TUI aesthetic.
- `npm run build` succeeds.
```

---

## PR #31 — `feat: @tanstack/react-table migration for items table`

```markdown
Migrate the dashboard's items table from plain HTML `<table>` to
`@tanstack/react-table` for proper sorting, filtering, and pagination.

1. Create `features/dashboard/DataTable.tsx`:
   - A reusable table component that wraps `@tanstack/react-table`.
   - Accepts: `data` (array), `columns` (column definitions), `onRowClick`
     (callback), `selectedRowId` (for highlighting), `globalFilter`, and `onGlobalFilterChange`.
   - Features:
     - **Sorting**: Clicking a column header sorts by that column. Show
       `▲`/`▼` indicators next to sorted column headers. Default sort by
       name ascending.
     - **Filtering & Search Unification**: Connect `globalFilter` to `DashboardPage`'s single existing search control (`fci-service-search`) so each service table has exactly one search input, applying filtering and sorting exactly once per table.
     - **Pagination**: Show pagination controls below the table:
       `[ < ] Page X of Y [ > ]` with configurable page size (default 10).
       Style with `fci-linkbtn`.
   - Styled entirely with `fci-` CSS classes (extend `tui-dashboard.css`):
     - Reuse existing `.fci-table` styles for the base table.
     - Add `.fci-table-sort-indicator`, `.fci-table-pagination`,
       `.fci-table-filter` styles.
   - The selected row should have the existing highlight style
     (`--dash-row-selected-bg`).

2. Replace the inline `<table>` and manual sorting/filtering state in `DashboardPage.tsx`'s items box with `<DataTable>`, delegating search and sorting state to `@tanstack/react-table`. Define column configurations per service:
   - VM: #, Name, Status, OS, IP, Mem, CPU
   - Database: #, Name, Status, Engine, Endpoint, Mem, Storage
   - IAM: #, User, Status, Role, Last Login, MFA, Region
   - Network: #, Name, Status, Type, CIDR, Region, Gateway
   - Storage: #, Name, Status, Access, Size, Region, Objects

3. Move column definitions to `features/dashboard/columns.ts` — one column
   config array per service. Include cell renderers for colored status values
   (using the `statusColors` maps from `mockServiceData.ts`).

4. Remove the now-unused `dataset.headers` rendering logic from `DashboardPage`.

Scope: `features/dashboard/DataTable.tsx`, `features/dashboard/columns.ts`,
`DashboardPage.tsx`, `tui-dashboard.css`.

Acceptance criteria:

- All 5 service tables support sorting by clicking column headers.
- The global filter searches across all columns.
- Pagination works (10 rows per page, with < > controls).
- Selected row highlighting still works.
- The table looks identical to the old one when not sorting/filtering.
- `npm run build` succeeds.
```

---

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

## Quick reference: PR → route map

| PR  | Route(s) added/modified                                           |
| --- | ----------------------------------------------------------------- |
| #10 | (no route changes — refactor only)                                |
| #11 | (no new routes — wires VM data into existing `/services/vm/:tab`) |
| #12 | (no new routes — adds mutations)                                  |
| #13 | (no new routes — wires metrics tab)                               |
| #14 | (no new routes — wires console tab with Xterm)                    |
| #15 | (no routes — data layer only)                                     |
| #16 | `/services/database/create`                                       |
| #17 | (no new routes — SQL Editor & Data Import tabs)                   |
| #18 | (no routes — data layer only)                                     |
| #19 | `/services/iam/create`                                            |
| #20 | (no routes — data layer only)                                     |
| #21 | `/services/storage/create`                                        |
| #22 | (no routes — data layer only)                                     |
| #23 | `/services/network/create`                                        |
| #24 | (no new routes — styling consolidation)                           |
| #25 | (no new routes — toast system)                                    |
| #26 | (no new routes — responsive layout)                               |
| #27 | (no new routes — keyboard shortcuts)                              |
| #28 | `/login`, `/callback` (+ protection on all routes)                |
| #29 | `*` (404 catch-all)                                               |
| #30 | `/dashboard` (overview page)                                      |
| #31 | (no new routes — table migration)                                 |
| #32 | (no new routes — WebSocket layer)                                 |
| #33 | (no new routes — code splitting)                                  |
| #34 | (no new routes — tests)                                           |
| #35 | (no new routes — deployment)                                      |

## Quick reference: Sprint → PR map

| Sprint               | PRs     | Theme                                                      |
| -------------------- | ------- | ---------------------------------------------------------- |
| Sprint 0/1 ✅        | #1–#9   | Setup, Theme, Layout, Routing, VM Data Layer               |
| Sprint 2B ✅         | #10–#14 | Dashboard Hardening & VM Completion                        |
| Sprint 3 ✅          | #15–#21 | Database, IAM & Storage Services (data layers + UI wiring) |
| Sprint 3 (Remaining) | #22–#23 | Network Service (data layer + UI wiring)                   |
| Sprint 4             | #24–#35 | Auth, Polish, Tests, Production                            |
