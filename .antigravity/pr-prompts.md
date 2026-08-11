# TUI Cloud Dashboard — Claude Code Prompts (35 PRs)

This document turns the sprint-based PR plan into ready-to-paste prompts for Claude Code. Give Claude Code **one prompt per PR**, in order, review the diff, run/test it, commit, then move to the next. Don't batch multiple PRs into one prompt — the whole point of the plan is small, reviewable units.

## How to use this

1. Claude Code reads `CLAUDE.md` at your repo root automatically at the start of every session, so you don't need to repeat the design system or stack in every prompt.
2. For each PR, copy the prompt from the matching section into Claude Code.
3. After Claude Code finishes a PR, actually check the acceptance criteria yourself before starting the next prompt — several later PRs assume earlier ones are truly done.
4. If Claude Code drifts from the TUI aesthetic or the folder structure, point it back at `CLAUDE.md` rather than re-explaining from scratch.

---

# 🟢 COMPLETED TECHNICAL ARCHITECTURE & STATE — Sprint 1–3 (PRs #1–#23)

> **Sprints 1 through 3 (PRs #1 through #23) are fully completed.** The core architecture, styling system, MSW mock API data layer, interactive VM management, Recharts metric visualizations, interactive Xterm.js serial terminal emulator, Database service (Monaco SQL editor, data import), IAM service (data layer, live tabs, Zustand store), Storage service (buckets, file browser, metrics), and Network service (nested firewall rules, routes, VPC peerings, IPv4 CIDR validation, standardized table layouts) are implemented and verified end-to-end. **Future development continues with Consolidate Dual Styling System and Remove Dead Code (PR #24).**

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
│   │   ├── DashboardModal.tsx      # Accessible portal modal with focus trap & focus restoration
│   │   ├── SortableHeader.tsx      # Accessible <th> header with keyboard focus & sort indicator
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
│   │       ├── SqlEditorSection.tsx   # SQL Editor toolbar, script history, Monaco editor, result panel
│   │       └── DataImportSection.tsx  # Data Import drag-drop panel, preview, import options, status
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
│   ├── StandaloneConsolePage.tsx   # Standalone full-screen VM serial console view
│   └── tui-dashboard.css           # Core FCI design system styles & CSS theme custom properties
├── store/
│   └── themeStore.ts               # Zustand store managing visual theme selection
└── utils/
    ├── fileParser.ts               # Async file reading & preview parsing utility (CSV, JSON, SQL)
    └── fileValidator.ts            # File size, extension, and import option validation helpers
```

---

## Technical Summary of Completed Sprints

### Sprint 1: Core Architecture, VM Service & Modular Tabs (PRs #1–#11)

- **PRs #1–#3 (Foundation & Infrastructure)**: Scaffolded React + TypeScript app with Vite, React Router v6, React Query, Zustand, Axios, Recharts, Xterm.js, and MSW. Created 4-theme engine (`default`, `beige`, `mono`, `navy`) and custom TUI CSS design system (`tui-dashboard.css`).
- **PRs #4–#9 (VM Service & REST Data Layer)**: Built REST data layer in `src/features/vm/` backed by MSW handlers (`/api/vms`). Built inline `VmCreateForm` with custom TUI form inputs (`TerminalInput`, `TerminalSelect`), `VmDetailPage`, and Docker containerization.
- **PR #10 (Dashboard & Tab Refactoring)**: Modularized monolithic tab JSX into isolated components in `src/features/dashboard/tabs/` (`VmTabContent`, `DatabaseTabContent`, `IamTabContent`, `NetworkTabContent`, `StorageTabContent`). Centralized dashboard configuration in `src/features/dashboard/constants.ts`.
- **PR #11 (Live MSW Table & Detail Panel Integration)**: Wired live MSW data to the primary items table in `DashboardPage.tsx` when VM service is active. Enabled dynamic right-side detail panel synchronization (Info & Details tabs), loading indicators (⏳), error states, search filtering, and action toolbar.

### Sprint 2: VM Interactivity, Metrics & Terminal Console (PRs #12–#14)

- **PR #12 (VM Inline Actions, Table Sorting & Modal A11y)**:
  - Added `UpdateVmInput` type validation in API/MSW layer preventing mutations to immutable fields (`id`, `createdAt`, `ipAddress`, `region`, `diskType`).
  - Created `DashboardModal` portal modal with focus trap, Escape key listener, and focus restoration to invoking elements.
  - Implemented `useSortableRows` hook and `SortableHeader` component for keyboard-accessible column sorting with numeric parsing (e.g. `"8 GB"`, `"4 vCPU"`).
  - Added inline VM actions (start, stop, reboot with 2s state transition timer safety, delete with modal confirmation) and click-outside row deselect.
- **PR #13 (Live VM Metrics Visualization & Range Selector)**:
  - Built `AsciiProgressBar` component rendering ASCII block progress bars (`█` filled, `░` empty) styled via `--dash-*` theme variables.
  - Extended MSW handlers and React Query hooks (`useVmMetrics`) with `MetricRange` filtering (`30m`, `1h`, `3h`, `1w`).
  - Integrated Recharts `LineChart` into `VmTabContent` with transparent background, custom tooltips, theme-matched series colors (`#4fa8dc` CPU, `#e8c07d` Memory, `#7ec87e` Disk), and inline table row progress bars.
- **PR #14 (Interactive Xterm.js Serial Console)**:
  - Created `TerminalView` component wrapping `@xterm/xterm` and `@xterm/addon-fit`, configured with dark terminal colors matching the FCI palette, auto-resize via `ResizeObserver`, and clean disposal logic.
  - Built `mockShell` fake shell engine supporting interactive typing, backspace, prompt formatting (`root@<vmName>:~$`), and command parsing (`help`, `ls`, `pwd`, `whoami`, `uname -a`, `df -h`, `free -m`, `uptime`, `clear`).
  - Integrated `TerminalView` into `VmTabContent` console tab and added standalone console route at `/services/vm/instances/:id/console`.

### Sprint 3: Database Service — Data Layer, Live Tabs, SQL Editor & Data Import (PRs #15–#17)

- **PR #15 (Database REST API & MSW Mock Layer)**: Defined `Database` and `DatabaseMetricPoint` types, created Faker-seeded in-memory database store (`src/mocks/data/databases.ts`), MSW handlers (`/api/databases`), Axios API client, and React Query hooks (`useDatabases`, `useDatabaseMetrics`).
- **PR #16 (Database Live Dashboard Tabs & Create Form)**: Wired `DashboardPage.tsx` and `DatabaseTabContent.tsx` to live MSW data, implemented connection string copy button, database delete modal, `DatabaseCreateForm` at `/services/database/create`, and metrics progress bars & charts.
- **PR #17 (SQL Editor & Data Import Section)**: Integrated lazy-loaded Monaco SQL code editor (`SqlEditor.tsx`) with custom dark TUI theme (`fci-sql-dark`), query result table (`QueryResultPanel.tsx`), drag-and-drop CSV/JSON/SQL file import panel (`DataImportPanel.tsx`), parsing/validation utilities (`fileParser.ts`, `fileValidator.ts`), toolbar actions (Execute, Clear, Format), mock MSW endpoints (`/execute-sql`, `/import-data`), Zustand database & VM stores (`store.ts`), creation form store migration, database-scoped execution & import history, database-bound `scriptRef`, theme switching selection preservation, button design system alignment, and About Creator link.

---

# SPRINT 3 — Remaining Services (Database, IAM, Network, Storage)

> Each of these service pairs (data layer + UI wiring) follows the same pattern
> established by the VM service. They don't depend on each other — you can do them
> in any order.

## Completed in Sprint 3 — Database, IAM & Storage Services (PRs #15–#21)

> **Sprint 3 (Database, IAM & Storage Services: PRs #15–#21) is fully completed.** The Database, IAM, and Storage domain models, MSW mock server layers, live dashboard integrations, interactive action modals, creation wizards, Monaco SQL code editor, file data import engine, Zustand feature UI stores, region selection, bucket management with file browsing, and live metrics visualization are implemented and verified end-to-end.

### 1. Domain Types, API Client & React Query Layer (`PR #15`)

- **TypeScript Definitions (`src/features/database/types.ts`)**:
  - `DatabaseEngine` (`'postgres' | 'mysql' | 'redis'`), `DatabaseStatus`, `BackupStatus`, and `Region` (`'ANK' | 'IST'`) union types.
  - `Database` domain entity model, `DatabaseMetricPoint`, `CreateDatabaseInput`, `UpdateDatabaseInput`, `SqlExecutionResult`, and `ImportOptions`.
- **Faker-Seeded In-Memory Store (`src/mocks/data/databases.ts`)**:
  - Generated realistic PostgreSQL, MySQL, and Redis instances with formatted connection strings and `'ANK'` / `'IST'` regions.
  - Stateful CRUD mutation helpers: `getDatabases()`, `getDatabaseById()`, `createDatabase()`, `updateDatabase()`, `deleteDatabase()`.
- **MSW Mock API Handlers (`src/mocks/handlers/database.ts` & `browser.ts`)**:
  - Endpoint handlers for `GET /api/databases` (filtering & artificial latency), `GET /api/databases/:id`, `POST /api/databases`, `DELETE /api/databases/:id`, `PATCH /api/databases/:id`, and `GET /api/databases/:id/metrics`.
- **API Client & Hooks (`src/features/database/api.ts` & `hooks.ts`)**:
  - Axios HTTP methods and React Query hooks (`useDatabases`, `useDatabase`, `useCreateDatabase`, `useUpdateDatabase`, `useDeleteDatabase`, `useDatabaseMetrics`).

### 2. Live Dashboard Tabs, Detail Panel & Action Bar Wiring (`PR #16`)

- **Main Table & Side Panel Integration (`src/pages/DashboardPage.tsx`)**:
  - Transformed `Database[]` into `ServiceRow[]` structure with status filtering, searching, loading indicators, and `Region` column inserted between Name and Status.
  - Info Tab: Metadata specs and connection string `[Copy]` button with 3-state clipboard feedback (`Copy` → `Copied!` → `Failed`) auto-resetting on selection change.
  - Details Tab: Performance metrics, connection counts, backup health status, and ISO timestamps.
- **Tab Content Wiring (`src/features/dashboard/tabs/DatabaseTabContent.tsx`)**:
  - Wired live metrics to Recharts `LineChart` and `AsciiProgressBar` components (CPU, Memory, Connections).
  - Connections tab metadata grid, system logs tab, and backups history table.
- **Action Toolbar & Dialog Modals (`src/pages/DashboardPage.tsx` & `router.tsx`)**:
  - Modal dialogs for **Connect**, **Take Backup**, **Restore**, and **Delete** with unified `closeModal()` error recovery and row-level error resets.
  - Inline `DatabaseCreateForm` page (`src/features/database/pages/DatabaseCreateForm.tsx`) at `/services/database/create` with TUI inputs, Region selector (`ANK` / `IST`), schema validation, and redirect.

### 3. Interactive SQL Editor & Data Import Subsystem (`PR #17`)

- **Monaco SQL Code Editor & ScriptRef Binding (`src/components/editor/SqlEditor.tsx` & `SqlEditorSection.tsx`)**:
  - `@monaco-editor/react` integration with custom TUI dark theme (`fci-sql-dark`), line wrapping, syntax highlighting, and synchronous `onChange` controlled flow eliminating stale callback race conditions on database switch.
  - Integrated toolbar (`SqlEditorSection.tsx`) supporting **Execute** (`Ctrl/Cmd + Enter`), **Clear**, **Format** (`sql-formatter`), TanStack Query `useExecuteSql` mutation state, and database-bound `scriptRef.current` (`{ databaseId, script }`) preventing stale script execution when switching databases.
- **Database & VM Feature UI Zustand Stores (`src/features/database/store.ts` & `src/features/vm/store.ts`)**:
  - Centralized store (`useDatabaseStore`) for per-database SQL scripts (`scripts`), query result table sorting (`sorting`), deletion errors (`deleteError`), copy feedback state (`copyState`), and creation form draft state (`createForm`, `setCreateFormField`, `updateCreateEngine`, `resetCreateForm`).
  - Created `useVmStore` managing `VmCreateFormState` draft inputs (`createForm`, `setCreateFormField`, `resetCreateForm`).
- **Creation Forms Store Migration (`DatabaseCreateForm.tsx` & `VmCreateForm.tsx`)**:
  - Refactored `DatabaseCreateForm.tsx` and `VmCreateForm.tsx` to eliminate local `useState<FormState>` duplication, binding draft form fields directly to Zustand store states with automatic form resets on cancel or success.
- **Query Results Grid & Scoped Execution (`src/components/database/QueryResultPanel.tsx` & `SqlEditorSection.tsx`)**:
  - `@tanstack/react-table` results table for `SELECT` queries with column sorting backed by Zustand store.
  - Execution results and mutation status scoped per `databaseId` (`queryResults: Record<string, ScopedQueryResult>`) preventing cross-database result leakage.
- **File Data Import Engine (`src/components/database/DataImportPanel.tsx` & `DataImportSection.tsx`)**:
  - Drag-and-drop file upload zone for `.csv`, `.json`, `.sql` files (<10MB limit) with full-text JSON preview parsing (`fileParser.ts`) and size validation (`fileValidator.ts`).
  - Database-scoped file selection, automatic reset on database switch, `filePreview.error` validation gate, and per-database import history (`Record<string, ImportResult[]>`).
- **Mock SQL Execution & Import Endpoints (`src/mocks/handlers/database.ts`)**:
  - `POST /api/databases/:id/execute-sql`: SQL length checks, dangerous DDL keyword rejection (`DROP`, `TRUNCATE`), mock query result generator, and artificial delay.
  - `POST /api/databases/:id/import-data`: FormData file parser, validation error responses, and mock row import counts.
- **Region Field & Table Alignment (`'ANK'` / `'IST'`)**:
  - Added restricted `Region` field (`'ANK'` | `'IST'`) across VM and Database domain entities, mock generators, and create form dropdowns (`VmCreateForm.tsx`, `DatabaseCreateForm.tsx`).
  - Added `Region` column between `Name` and `Status` in VM and Database tables with uniform flex action button spacing (`DashboardPage.tsx`).
- **Theme Switcher State & Button Design System (`themeStore.ts`, `DashboardPage.tsx`, `tui-dashboard.css`)**:
  - Fixed theme switching to preserve active views (e.g. VM/DB Detail panels) by excluding theme switcher and footer links from document click selection resets.
  - Synchronized `data-theme` attribute on `document.documentElement` during `setTheme` and store rehydration.
  - Aligned Back buttons (`.fci-topbtn-back`) and footer links to match top action button component variants (4px rectangular border-radius, box shadow, hover elevation).
  - Inserted **About Creator** action button adjacent left to `Docs` button linking to `https://theomerkaratas.github.io/resume/`.

### 4. IAM Service — Data Layer & MSW Mock API (`PR #18`)

- **Domain Types & Interfaces (`src/features/iam/types.ts`)**:
  - `IamUser` entity model (`id`, `name`, `email`, `status`, `role`, `lastLogin`, `mfaEnabled`, `region`, `createdAt`).
  - `IamPolicy` entity model (`id`, `userId`, `name`, `type`, `permissions`, `attachedAt`, `status`).
  - `IamUserWithPolicies` detail view model, `CreateIamUserInput`, `UpdateIamUserInput`.
- **Faker-Seeded In-Memory Store (`src/mocks/data/iamUsers.ts`)**:
  - Generated realistic IAM users with 2-4 attached policies each.
  - Stateful CRUD helper functions (`getIamUsers`, `getIamUserById`, `createIamUser`, `updateIamUser`, `deleteIamUser`).
- **MSW Mock API Handlers (`src/mocks/handlers/iam.ts` & `browser.ts`)**:
  - Endpoint handlers for `GET /api/iam/users`, `GET /api/iam/users/:id`, `POST /api/iam/users`, `DELETE /api/iam/users/:id`, and `PATCH /api/iam/users/:id`.
  - Registered in `src/mocks/browser.ts` and `src/test/server.ts`.
- **API Client & React Query Hooks (`src/features/iam/api.ts` & `hooks.ts`)**:
  - Axios HTTP wrappers and TanStack Query hooks (`useIamUsers`, `useIamUser`, `useCreateIamUser`, `useDeleteIamUser`, `useUpdateIamUser`) with query keys `['iam-users']` and `['iam-users', id]`.
- **Vitest Test Suite (`src/features/iam/__tests__/`)**:
  - 85 unit and integration tests covering types, mock data generation, store CRUD operations, MSW HTTP endpoints, Axios API layer, and React Query hooks.

### 5. IAM Service Dashboard UI Wiring & Zustand Store Migration (`PR #19`)

- **Main Table & Detail Panel Integration (`src/pages/DashboardPage.tsx`)**:
  - Transformed `IamUser[]` data from `useIamUsers()` into `ServiceRow[]` structure (Name, Status, Role, Last Login, MFA Status, Region).
  - Info Tab: Rendered Name, Email, Status, Role, Last Login, MFA Status, and Region.
  - Details Tab: Rendered Created date, Role, MFA status, and attached Policies table (Policy Name, Type, Attached At, Status).
- **Tab Content Wiring (`src/features/dashboard/tabs/IamTabContent.tsx`)**:
  - Permissions tab: Flattened and displayed all permissions across attached policies (Resource, Action, Effect [colored: Allow=green, Deny=red], Condition) with "Select a user to view permissions" prompt when no user is selected.
  - Policies tab: Displayed attached policies table (Policy Name, Type [Managed/Custom], Attached At, Status [colored: Active=green, Review needed=amber]) with "Select a user to view attached policies" prompt when no user is selected.
  - Activity tab: Preserved hardcoded recent activity logs with TODO annotation for future endpoint.
- **Action Bar Modals & Error Recovery (`src/pages/DashboardPage.tsx`)**:
  - Edit Role (`TerminalSelect` dropdown) and Revoke Access (status `disabled` confirmation) modals backed by `useUpdateIamUser` mutation.
  - Caught `mutateAsync` failures, stored error in Zustand store (`actionError`), rendered inline error message (`✗ <message>`), and guarded modal closure to succeed only on valid mutations.
- **IAM Feature Zustand UI Store & Creation Wizard (`src/features/iam/store.ts` & `IamCreateForm.tsx`)**:
  - Created `useIamStore` managing draft form state (`createForm`), field validation errors (`createFormErrors`), success flag (`createFormSuccess`), and modal operation errors (`actionError`).
  - Refactored `IamCreateForm` at `/services/iam/create` with TUI inputs (`TerminalInput`, `TerminalSelect` for Role), schema validation (Name required, Email required with `@`), and automatic form reset on submit or cancel.
- **TabContent Render Branching (`src/pages/DashboardPage.tsx`)**:
  - Updated detail panel render branching so IAM permissions and policies tabs render `TabContent` even when no user row is selected, allowing `IamTabContent` to display its user selection prompts.
- **Routing & Constants (`src/app/router.tsx` & `src/features/dashboard/constants.ts`)**:
  - Added `/services/iam/create` route and updated service menu navigation handlers.

---

### 6. Storage Service — Data Layer & Dashboard Wiring (`PR #20–#21`)

- **Domain Types & MSW Handlers (`PR #20`)**: Defined `Bucket`, `StorageFile`, `StorageMetricPoint`, `CreateBucketInput` types; generated 6-8 fake buckets with 5-15 files per bucket; created Faker-seeded in-memory store; implemented MSW handlers (`GET /api/buckets`, `POST /api/buckets`, `DELETE /api/buckets/:id`, `GET /api/buckets/:id/files`, `GET /api/buckets/:id/metrics`).
- **API Client & React Query Hooks (`PR #20`)**: Created `useBuckets()`, `useBucket(id)`, `useCreateBucket()`, `useDeleteBucket()`, `useBucketFiles(bucketId)`, `useBucketMetrics(bucketId)` with `storageKeys` factory pattern.
- **Dashboard Live Wiring (`PR #21`)**: Wired `DashboardPage.tsx` to transform `Bucket[]` into `ServiceRow[]` structure with `formatBytes()` utility for human-readable size display (GB/MB/KB); updated Info/Details tabs with bucket metadata (Name, Access Level, Status, Region, Total Size, Object Count, Created date, Versioning, Lifecycle); wired Objects tab to live file list from `useBucketFiles()`, Access tab with hardcoded IAM bindings table, Metrics tab with `AsciiProgressBar` progress and Recharts line charts for Read Ops/Write Ops/Object Count.
- **Bucket Create Form & Actions (`PR #21`)**: Built `BucketCreateForm` with Bucket Name regex validation (`/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/`), Region selector (ANK/IST), Access level selector (private/public-read/public-read-write); wired service menu actions (Create bucket → `/services/storage/create`, Upload → demo modal, Set policy → coming soon modal, Delete → confirm modal with mutation).
- **Row-Level Actions & Live Table** (`PR #21` + follow-ups): Added Delete and Add File buttons to each Storage table row with inline action styling; implemented live storage occupancy usage bar mirroring VM/Database patterns; verified end-to-end create/delete flows.
- \*\*Technical Tests & Validation (`PR #21` + follow-ups): Created `formatBytes()` unit tests, `BucketCreateForm` component tests (validation, submission, error handling), `StorageTabContent` integration tests (Objects/Access/Metrics tab data loading); refactored Tab navigation so Info tab is always visible regardless of row selection; set Info as default tab across all services; added empty-state messages ("Select a bucket to view objects", "No metrics available") for better UX.

---

### 7. Network Service — Data Layer, Live Dashboard Wiring & Table Standardization (`PR #22–#23`)

- **Domain Types, API Layer & MSW Mock Handlers (`PR #22`)**: Defined `Network`, `FirewallRule`, `NetworkRoute`, `VpcPeering`, `CreateNetworkInput` types; built Faker-seeded in-memory network store (`src/mocks/data/networks.ts`); implemented MSW HTTP endpoints (`GET/POST/DELETE /api/networks`, `/firewall-rules`); created Axios client and React Query hooks (`useNetworks`, `useNetwork`, `useCreateNetwork`, `useDeleteNetwork`, `useAddFirewallRule`, `useDeleteFirewallRule`).
- **Live Dashboard Integration & Action Modals (`PR #23`)**: Wired `DashboardPage.tsx` and `NetworkTabContent.tsx` to live MSW data; created live Firewall rules table with color-coded action badges (`ALLOW` green / `DENY` red), rule name delete confirmation modal, inline rule addition dialog, Routes table, and Peering table; wired service actions and network delete modal.
- **Network Creation Wizard (`PR #23`)**: Built `NetworkCreateForm.tsx` at `/services/network/create` with TUI inputs, type selector (VPC/subnet/public), and IPv4 CIDR regex validation (`/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(3[0-2]|[12]?[0-9])$/`).
- **Global Table Standardization & CodeRabbit Refinements (`PR #23` + follow-ups)**: Added `Region` column positioned immediately following `Name`/`User` across all 5 service lists (`VM`, `Database`, `Storage`, `Network`, `IAM`); set `.fci-table th` vertical padding to `6px 8px 8px 8px` preventing character clipping; added first data row top padding (`10px`); enforced standardized `8ch` / `80px` uniform ID column width; added 4px left spacing to sort indicator icons; enabled service-aware multi-column table sorting (`useSortableRows`).

---

# SPRINT 4 — Polish, Auth, Production Readiness

## PR #24 — `fix: consolidate dual styling system and remove dead code`

```markdown
Eliminate the dual styling system and remove unused code that accumulated during
the first 9 PRs.

1. **Remove dead `App.tsx`**: `main.tsx` already uses `RouterProvider` directly
   via `providers.tsx`. Delete `src/App.tsx`.

2. **Update `lib/tui-theme.ts`**: This file defines a single "default" theme with
   old black/white values that nothing uses. Either:
   - Delete it entirely if nothing imports it (check first), OR
   - Update it to export the actual dashboard theme values from
     `tui-dashboard.css` as typed constants (for any programmatic usage like
     Recharts/Xterm theming).
     Check all imports of `tui-theme.ts` across the codebase and update them.

3. **Migrate `VmDetailPage` to dashboard styling**: The standalone
   `/services/vm/instances/:id` page uses Tailwind-based `Panel`/`Button`/
   `StatusBadge`/`Modal`/`QueryState` from `components/ui/`. Restyle it to use
   `fci-` CSS classes instead:
   - Replace `Panel` wrapper with `fci-detail-panel fci-panel-titled`.
   - Replace `Button` with `fci-linkbtn` variants.
   - Replace `StatusBadge` with inline colored spans using `statusColors`.
   - Replace `Modal` usage with `DashboardModal` from PR #12.
   - Replace `QueryState` with inline loading/error handling using
     `--dash-text-dim` styled states.
   - Add `import '../../../pages/tui-dashboard.css'` (or restructure the CSS import).
   - Wrap the page in `<div className="fci-page" data-theme={theme}>` so the
     dashboard's theme variables are active.

4. **Clean up `components/ui/` if fully unused**:
   - After migrating `VmDetailPage`, check if any file still imports from
     `components/ui/`. If `Panel`, `Button`, `StatusBadge`, `QueryState` are
     unused, add a comment at the top of each: `// NOTE: This component uses
the legacy Tailwind styling system. The dashboard uses fci-* CSS classes.
// Retained for /ui-preview route only.`
   - Do NOT delete them — they're still used by `/ui-preview`.

5. **Clean up empty `.gitkeep` files**: Remove `.gitkeep` from any directory
   that now has real files (e.g. `components/terminal/` after PR #14,
   `features/` after the service PRs).

Scope: `App.tsx` (delete), `lib/tui-theme.ts`, `features/vm/pages/VmDetailPage.tsx`,
`components/ui/*.tsx` (comments only), various `.gitkeep` files.

Acceptance criteria:

- `App.tsx` is deleted. `npm run build` still works.
- `VmDetailPage` renders with the dashboard's visual style, not the Tailwind
  primitives' style.
- No remaining Tailwind class usage in `VmDetailPage`.
- All 4 themes work on the detail page.
- `npm run build` succeeds.
```

---

## PR #25 — `feat: toast/notification system for mutations`

````markdown
Create a lightweight toast notification system that replaces the inline success/
error messages scattered throughout the dashboard.

1. Create `features/dashboard/Toast.tsx`:
   - A self-contained toast component that renders in a fixed position
     (bottom-right of the viewport, above the footer).
   - Supports types: `success`, `error`, `info`.
   - Auto-dismisses after 3 seconds (configurable).
   - Styled with `fci-` classes:
     - Container: `position: fixed; bottom: 60px; right: 20px; z-index: 100`
     - Toast box: `fci-` bordered panel, monospace, matching dashboard colors
     - Success: green left border (using `#7ec87e`)
     - Error: red left border (using `#e0546a`)
     - Info: blue left border (using `#4fa8dc`)
     - Slide-in animation from the right

2. Create `store/toastStore.ts` using zustand:
   - State: `toasts: Toast[]` (each with `id`, `message`, `type`, `duration`).
   - Actions: `addToast(message, type, duration?)`, `removeToast(id)`.
   - Auto-generate unique IDs (e.g. incrementing counter or `Date.now()`).
   - Support multiple simultaneous toasts (stack vertically).

3. Add the toast container to `DashboardPage.tsx` — render `<ToastContainer />`
   at the bottom of the `fci-page` div (after the footer).

4. Replace all existing success/error inline messages with toast calls:
   - `VmCreateForm`: on success, `addToast("VM created successfully", "success")`
     instead of the inline green text.
   - VM delete (PR #12): on success, `addToast("VM deleted", "success")`.
   - VM stop/reboot: on success, `addToast("VM status updated", "info")`.
   - Database create/delete: same pattern.
   - IAM create/delete/role-change: same pattern.
   - Network create/delete/firewall-rule add-delete: same pattern.
   - Storage create/delete: same pattern.
   - All mutation errors: map known failure codes to safe user-facing messages, fallback to `"Operation failed"` (prohibit exposing raw `error.message` directly in toasts), and keep raw error details in `console.error` logs.

5. Add CSS for toasts to `tui-dashboard.css`:
   ```css
   .fci-toast-container { ... }
   .fci-toast { ... }
   .fci-toast-success { border-left: 3px solid #7ec87e; }
   .fci-toast-error { border-left: 3px solid #e0546a; }
   .fci-toast-info { border-left: 3px solid #4fa8dc; }
   @keyframes fci-toast-slide-in { ... }
   ```

Scope: `features/dashboard/Toast.tsx`, `store/toastStore.ts`,
`DashboardPage.tsx`, `tui-dashboard.css`, all create form components,
`DashboardPage.tsx` (mutation handlers).

Acceptance criteria:

- Creating a VM shows a green toast "VM created successfully" in the bottom-right.
- Deleting any resource shows a toast.
- Errors show a red toast.
- Toasts auto-dismiss after 3 seconds.
- Multiple toasts stack vertically.
- `npm run build` succeeds.
````

---

## PR #26 — `feat: wire keyboard shortcuts from footer`

```markdown
The footer shows keyboard hints (/ Find, ^s Search, ^n New item, ^c Copy,
^d Delete, ^i Info) but none are actually wired. Implement them.

1. Create `features/dashboard/useKeyboardShortcuts.ts` — a custom React hook
   that registers document-level keydown listeners:
   - `/` (slash): Focus the active service's search input. Prevent default only
     when no input/textarea is already focused.
   - `Ctrl+S` (or `Cmd+S` on Mac): Focus the global search input in the
     linkgrid. Prevent default (override browser save).
   - `Ctrl+N`: Navigate to the create route for the active service (e.g.
     `/services/vm/create`). Prevent default.
   - `Ctrl+C`: If a row is selected, copy the selected row's name to clipboard.
     Show a toast "Copied: <name>". Do NOT prevent default if no row is
     selected (let normal Ctrl+C work).
   - `Ctrl+D`: If a row is selected, trigger the delete flow (open confirm
     modal). Prevent default.
   - `Ctrl+I`: If a row is selected, switch to the Info tab. Prevent default.
   - `V`, `D`, `I`, `N`, `S` (lowercase, when no input is focused): Switch to
     the corresponding service (VM, Database, IAM, Network, Storage) — these
     correspond to the hotkey hints shown on each service box.
   - `Escape`: Clear any focused search input and close any open dropdown/modal.

2. Use the hook in `DashboardPage.tsx`.

3. Update the footer to reflect the actual working shortcuts accurately:
   - If any shortcut descriptions are wrong, fix the footer text.
   - Add the service hotkey hints if not already visible.

4. The hook must NOT fire when the user is typing in an input/textarea/select
   (check `document.activeElement?.tagName`). Exception: `/` and `Escape` work
   specially — `/` focuses the search input and `Escape` unfocuses it.

Scope: `features/dashboard/useKeyboardShortcuts.ts`, `DashboardPage.tsx`.

Acceptance criteria:

- Pressing `/` focuses the active service's search box.
- `Ctrl+N` navigates to the create form.
- `Ctrl+D` with a row selected opens the delete confirmation.
- `V`, `D`, `I`, `N`, `S` keys switch services when no input is focused.
- Shortcuts do NOT fire while typing in inputs.
- `npm run build` succeeds.
```

---

## PR #27 — `feat: Dashboard responsive layout (mobile/tablet)`

```markdown
Make the dashboard usable on mobile and tablet viewports. The current layout has
no breakpoints — the 5-column service grid, 12-column linkgrid, and 2-column
maingrid all break at small widths.

1. Add responsive CSS to `tui-dashboard.css` using media queries:

   **Tablet breakpoint (max-width: 768px)**:
   - `.fci-topgrid`: Change from `grid-template-columns: repeat(5, 1fr)` to a
     scrollable horizontal row or `repeat(3, 1fr)` with wrapping.
   - `.fci-linkgrid`: Collapse the 12-column grid. Hide the external link buttons
     (Docs, Grafana, Prometheus, Loki, Chaos Demo, Architecture) behind a
     `[More ▾]` dropdown or wrap them to a second row. Keep + Create, Refresh,
     Settings visible.
   - `.fci-maingrid`: Stack vertically (items table on top, detail panel below)
     instead of 2-column side-by-side.
   - `.fci-profile`: Keep visible but shrink — hide the name, show only the icon.

   **Mobile breakpoint (max-width: 480px)**:
   - `.fci-topgrid`: Stack all 5 service boxes into a horizontal scrollable
     strip (single row, scroll with overflow-x: auto, no wrapping). Each box
     should be min-width ~80px.
   - `.fci-linkgrid`: Show only + Create and Refresh as a flex row. Hide
     Settings and all external links. Add a `[⋯]` overflow menu for the hidden
     items.
   - `.fci-maingrid`: Full-width single column. Detail panel tabs should scroll
     horizontally if they overflow.
   - `.fci-tabs`: `overflow-x: auto; white-space: nowrap; -webkit-overflow-
scrolling: touch;`
   - Footer shortcuts: Hide the keyboard hints (they're irrelevant on mobile).
     Show only the theme switcher.

2. For the items table at small widths:
   - Wrap `fci-itemslist` in a container with `overflow-x: auto`.
   - Set minimum column widths so the table scrolls horizontally instead of
     crushing content.

3. Ensure the VM create form, Database create form, IAM create form, Network
   create form, and Storage create form all work at 375px width:
   - `.fci-split-layout`: Stack vertically on mobile (the description sidebar
     moves below the form).
   - `.fci-fieldrow`: Stack to single column on mobile.

4. Test the `DashboardModal` at mobile width — ensure it doesn't overflow.

Scope: `tui-dashboard.css` (responsive media queries), `DashboardPage.tsx`
(minimal — only if DOM changes are needed for the responsive behavior).

Acceptance criteria:

- At 375px viewport width: service boxes scroll horizontally, action bar shows
  only essential buttons, items table scrolls horizontally, detail panel is
  below the table, create forms stack vertically.
- At 768px: layout adapts gracefully without breaking.
- At 1440px: nothing changes from the current behavior.
- No horizontal scrollbar on the page body at any width.
- `npm run build` succeeds.
```

---

## PR #28 — `feat: OIDC auth integration (Authentik) and protected routes`

````markdown
Replace the pass-through auth stub with real OIDC configuration (Authentik as
IdP), add protected routes, a login page, and wire the auth token into axios.

1. Update `app/providers.tsx`:
   - Configure `react-oidc-context`'s `AuthProvider` with real config fields
     sourced from environment variables:
     - `VITE_OIDC_AUTHORITY` (e.g. `https://auth.example.com/application/o/fci/`)
     - `VITE_OIDC_CLIENT_ID`
     - `VITE_OIDC_REDIRECT_URI` (default: `window.location.origin + '/callback'`)
   - Add `onSigninCallback` that cleans up the URL after redirect (remove
     code/state params from the URL bar).
   - Keep fallback behavior: enable `AuthProvider` ONLY when all three required variables (`VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, and `VITE_OIDC_REDIRECT_URI`) are non-empty and valid. Otherwise, run in unauthenticated pass-through mode without `AuthProvider`.

2. Create `components/auth/ProtectedRoute.tsx`:
   - If OIDC configuration is incomplete / disabled, render children directly
     (pass-through mode for local dev without auth).
   - If configured and not authenticated, redirect to `/login`.
   - If configured and loading, show a TUI-styled loading screen (black
     background, centered blinking `[ AUTHENTICATING... ]` text using `fci-`
     styles).
   - Preserve the originally requested path for post-login redirect.

3. Create `pages/LoginPage.tsx`:
   - Styled with `fci-` CSS to match the dashboard aesthetic.
   - Guard against unauthenticated pass-through mode: if OIDC is not configured, redirect directly to `/` or display a message that auth is not enabled.
   - Black background, centered panel with:
     - "Free Cloud Initiative" title
     - A `[ Sign in with Authentik ]` button that calls `auth.signinRedirect()`.
     - If already authenticated, redirect to `/dashboard`.
   - This page should look like part of the same app.

4. Update `app/router.tsx`:
   - Add `/login` route rendering `LoginPage`.
   - Add `/callback` route that renders `LoginPage` (handles the OIDC redirect).
   - Wrap all `/services/*` and `/dashboard` routes with `ProtectedRoute`.

5. Update `lib/axios.ts`:
   - Replace the placeholder request interceptor with real token attachment.
   - Since `useAuth()` is a React hook and the axios interceptor runs outside
     React, use a module-level token variable that gets set by a component.
   - Create a `setAuthToken(token: string | null)` function exported from
     `lib/axios.ts`.
   - Create a small `AuthTokenSync` component in `components/auth/` that calls
     `useAuth()`, reads the access token, and calls `setAuthToken()` — render
     this component ONLY inside `AuthProvider` when auth is enabled to avoid `useAuth` hook context errors during pass-through mode.

6. Wire a `[Logout]` button in the dashboard:
   - In `DashboardPage.tsx`, wire the "Sign out" dropdown item in the Profile
     menu to call `auth.signoutRedirect()` (or `auth.removeUser()` + redirect
     to `/login`) when auth is enabled.
   - If auth is in pass-through mode, the "Sign out" item should just navigate
     to `/login` or show a toast "Auth not configured".

7. Update `.env.example` with the new OIDC variables:
   ```
   VITE_OIDC_AUTHORITY=https://auth.example.com/application/o/fci/
   VITE_OIDC_CLIENT_ID=your-client-id
   VITE_OIDC_REDIRECT_URI=http://localhost:5173/callback
   ```

Scope: `app/providers.tsx`, `components/auth/ProtectedRoute.tsx`,
`components/auth/AuthTokenSync.tsx`, `pages/LoginPage.tsx`, `app/router.tsx`,
`lib/axios.ts`, `DashboardPage.tsx`, `.env.example`.

Acceptance criteria:

- Without OIDC env vars set: app works exactly as before (pass-through mode).
- With OIDC env vars set: visiting `/dashboard` while unauthenticated redirects
  to `/login`; the login page shows a styled sign-in button; after
  authenticating, the user lands on the originally requested page.
- Outgoing API requests carry the auth token in the `Authorization` header.
- "Sign out" ends the session.
- `npm run build` succeeds.
````

---

## PR #29 — `feat: error boundary, 404 page, global loading skeleton`

````markdown
Add global error handling, a 404 page, and improve loading states.

1. Create `pages/NotFoundPage.tsx`:
   - Styled with `fci-` CSS, matching the dashboard aesthetic.
   - Black background, centered content:
     ```
     ╔══════════════════════════════════╗
     ║  404: RESOURCE NOT FOUND        ║
     ║                                 ║
     ║  The requested path does not    ║
     ║  exist in this terminal.        ║
     ║                                 ║
     ║  [ Return to Dashboard ]        ║
     ╚══════════════════════════════════╝
     ```
   - The `[ Return to Dashboard ]` button navigates to `/dashboard`.
   - Use actual Unicode box-drawing characters for the border or `fci-` styled
     panel — your call, just make it look in-character.

2. Create `pages/ErrorPage.tsx`:
   - A TUI-styled error page for React Router's `errorElement`.
   - Shows "SYSTEM ERROR" in red, with a generic message.
   - In dev mode (`import.meta.env.DEV`), also show the actual error message
     and stack trace in a `fci-console-log` styled block.
   - `[ Return to Dashboard ]` button.

3. Update `app/router.tsx`:
   - Add `errorElement={<ErrorPage />}` on the root route group.
   - Add a catch-all `*` route that renders `<NotFoundPage />`.

4. Update the loading states across the app to be consistent:
   - Create a `features/dashboard/DashboardLoading.tsx` component that renders
     a blinking `[ LOADING... ]` text in `fci-` styling. The blink animation
     should reuse the existing `fci-blink` keyframes from `tui-dashboard.css`.
   - Use this component in all places where we show loading states:
     - Items table loading row
     - Tab content loading (metrics, objects)
     - Create form submission pending state
   - Do NOT change the `components/ui/QueryState.tsx` — it's only used by the
     legacy `VmDetailPage`.

Scope: `pages/NotFoundPage.tsx`, `pages/ErrorPage.tsx`, `app/router.tsx`,
`features/dashboard/DashboardLoading.tsx`, various files for loading state
updates.

Acceptance criteria:

- Navigating to `/services/nonexistent` shows the TUI-styled 404 page.
- Deliberately throwing in a route component shows the error boundary page.
- Loading states across all services use the consistent blinking `[ LOADING... ]`.
- `npm run build` succeeds.
````

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
| #26 | (no new routes — keyboard shortcuts)                              |
| #27 | (no new routes — responsive layout)                               |
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
