# TUI Cloud Dashboard — Claude Code Prompts (35 PRs)

This document turns the sprint-based PR plan into ready-to-paste prompts for Claude Code. Give Claude Code **one prompt per PR**, in order, review the diff, run/test it, commit, then move to the next. Don't batch multiple PRs into one prompt — the whole point of the plan is small, reviewable units.

## How to use this

1. Claude Code reads `CLAUDE.md` at your repo root automatically at the start of every session, so you don't need to repeat the design system or stack in every prompt.
2. For each PR, copy the prompt from the matching section into Claude Code.
3. After Claude Code finishes a PR, actually check the acceptance criteria yourself before starting the next prompt — several later PRs assume earlier ones are truly done.
4. If Claude Code drifts from the TUI aesthetic or the folder structure, point it back at `CLAUDE.md` rather than re-explaining from scratch.

---

# 🟢 COMPLETED TECHNICAL ARCHITECTURE & STATE — Sprint 1–3 (PRs #1–#17)

> **Sprints 1 through 3 (PRs #1 through #17) are fully completed.** The core architecture, styling system, MSW mock API data layer, interactive VM management, Recharts metric visualizations, interactive Xterm.js serial terminal emulator, and Database service (REST data layer, live dashboard tabs, SQL Editor with Monaco, and Data Import engine) are in place. **Future development continues with IAM Service (PR #18).**

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

````text
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
````

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

## Completed in Sprint 3 — Database Service (PRs #15–#17)

> **Sprint 3 (Database Service: PRs #15, #16, and #17) is fully completed.** The database domain model, MSW mock server layer, live dashboard integration, interactive action modals, creation wizard, Monaco SQL code editor, file data import engine, Zustand database UI store, creation form store migration, and region selection are implemented and verified end-to-end.

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

---

## PR #18 — `feat: IAM service — data layer + MSW mock API`

````markdown
Build the IAM service's data layer and mock API. IAM represents users and access
policies rather than provisioned resources.

1. Create `features/iam/types.ts` with interfaces:
   - `IamUser`: `id`, `name` (display name), `email`, `status` ("active" |
     "disabled" | "locked"), `role` ("admin" | "editor" | "viewer" | "auditor"),
     `lastLogin` (string, ISO date), `mfaEnabled` (boolean), `region` (string),
     `createdAt` (string).
   - `IamPolicy`: `id`, `userId`, `name` (policy name), `type` ("managed" |
     "custom"), `permissions` (array of `{ resource: string, action: string,
     effect: "allow" | "deny", condition?: string }`), `attachedAt` (string, ISO date),
     `status` ("active" | "review-needed").
   - `IamUserWithPolicies`: `IamUser` with embedded `policies: IamPolicy[]` returned by detail endpoint.
   - `CreateIamUserInput`: `name`, `email`, `role`.

2. Create `mocks/data/iamUsers.ts`:
   - Generate 8-10 fake IAM users with realistic names/emails.
   - Each user has 2-4 attached policies.
   - Mutable store with CRUD functions.

3. Create `mocks/handlers/iam.ts` with MSW handlers:
   - `GET /api/iam/users` — returns user list.
   - `GET /api/iam/users/:id` — single user with embedded policies.
   - `POST /api/iam/users` — create user.
   - `DELETE /api/iam/users/:id` — delete user.
   - `PATCH /api/iam/users/:id` — update user (status, role changes).
   - No metrics endpoint for IAM.

4. Register handlers in `mocks/browser.ts`.

5. Create `features/iam/api.ts` and `features/iam/hooks.ts` with the standard
   pattern: `useIamUsers()`, `useIamUser(id)`, `useCreateIamUser()`,
   `useDeleteIamUser()`, `useUpdateIamUser()`.
   Query keys: `['iam-users']`, `['iam-users', id]`.

Scope: `features/iam/`, `mocks/data/iamUsers.ts`, `mocks/handlers/iam.ts`,
`mocks/browser.ts`.

Acceptance criteria:
- Mock IAM data loads correctly via a temporary debug call.
- All endpoints respond via MSW.
- `npm run build` succeeds.
````

---

## PR #19 — `feat: IAM service — wire dashboard tabs to live data`

````markdown
Wire the IAM service's dashboard tabs to live MSW data.

1. In `DashboardPage.tsx`, when `activeService === 'IAM'`:
   - Use `useIamUsers()` to fetch the user list.
   - Transform into `ServiceRow[]`: name → name (display name), status → status,
     role → col3, lastLogin (formatted) → col4, mfaEnabled → col5 ("Enabled" /
     "Disabled"), region → region. For `id`, use the IAM user's id.
   - Wire loading/error states.

2. Update Info tab for IAM:
   - Show Name, Email, Status, Role, Last Login, MFA Status, Region.

3. Update Details tab for IAM:
   - Show Created date, plus a "Policies" section listing the user's attached
     policies in a small table: Policy Name, Type, Attached At, Status.

4. Update `features/dashboard/tabs/IamTabContent.tsx`:
   - **Permissions tab**: Wire to the selected user's policies. Show a table
     with columns: Resource, Action, Effect (colored: Allow=green, Deny=red),
     Condition. Pull this data from the `permissions` array in the user's
     policies.
   - **Policies tab**: Show the user's attached policies in a table: Policy Name,
     Type (Managed/Custom), Attached At (date), Status (colored: Active=green,
     Review needed=amber).
   - **Activity tab**: Keep as hardcoded log entries for now (no activity endpoint).
     Add a TODO comment noting this.

5. Wire the IAM service menu items:
   - **"Add user"**: Navigate to `/services/iam/create`.
   - **"Edit role"**: If a user is selected, show `DashboardModal` with a
     `TerminalSelect` for the new role. On confirm, call `useUpdateIamUser()`
     with the new role.
   - **"Revoke access"**: Show `DashboardModal` confirmation, then call
     `useUpdateIamUser()` with `{ status: "disabled" }`.

6. Create `IamCreateForm` in `features/iam/pages/IamCreateForm.tsx`:
   - Fields: Name (text), Email (text), Role (TerminalSelect: admin/editor/
     viewer/auditor).
   - Validation: Name required, Email required and must contain "@".
   - On success: navigate to `/services/iam/details`.

7. Add `/services/iam/create` route.

Scope: `DashboardPage.tsx`, `features/dashboard/tabs/IamTabContent.tsx`,
`features/iam/pages/IamCreateForm.tsx`, `features/dashboard/constants.ts`,
`router.tsx`.

Acceptance criteria:
- `/services/iam/details` shows real IAM user data in the table.
- Permissions and Policies tabs show data from the selected user's policies.
- Edit role and revoke access work with confirmation modals.
- Create form works end-to-end.
- `npm run build` succeeds.
````

---

## PR #20 — `feat: Network service — data layer + MSW mock API (nested firewall rules)`

````markdown
Build the Network service's data layer and mock API. Network has nested data
(firewall rules per network) and a separate routes table.

1. Create `features/network/types.ts` with interfaces:
   - `FirewallRule`: `id`, `name`, `direction` ("ingress" | "egress"),
     `protocol` ("tcp" | "udp" | "icmp" | "all"), `portRange` (string),
     `source` (CIDR string or "any"), `action` ("allow" | "deny").
   - `NetworkRoute`: `id`, `destination` (CIDR), `nextHop` (string),
     `priority` (number), `status` ("active" | "pending").
   - `VpcPeering`: `id`, `peerVpc` (string), `peerRegion` (string),
     `peerCidr` (string), `status` ("active" | "pending" | "failed").
   - `Network`: `id`, `vpcName`, `cidrBlock`, `type` ("vpc" | "subnet" |
     "public"), `status` ("active" | "down" | "pending"), `gateway` (string),
     `region`, `firewallRules: FirewallRule[]`, `routes: NetworkRoute[]`,
     `peerings: VpcPeering[]`, `createdAt`.
   - `CreateNetworkInput`: `vpcName`, `cidrBlock`, `type`.

2. Create `mocks/data/networks.ts`:
   - Generate 6-8 fake networks, each with 3-5 firewall rules, 2-4 routes,
     and 1-2 peering connections.
   - Use realistic VPC names ("prod-vpc-01", "staging-vpc", "dev-network").
   - CIDR blocks like "10.0.0.0/16", "10.128.0.0/20", "172.16.0.0/12".

3. Create `mocks/handlers/network.ts` with MSW handlers:
   - `GET /api/networks` — full list.
   - `GET /api/networks/:id` — single network with nested data.
   - `POST /api/networks` — create network.
   - `DELETE /api/networks/:id` — delete network.
   - `POST /api/networks/:id/firewall-rules` — add a firewall rule.
   - `DELETE /api/networks/:id/firewall-rules/:ruleId` — delete a firewall rule.

4. Register handlers in `mocks/browser.ts`.

5. Create `features/network/api.ts` and `features/network/hooks.ts`:
   - `useNetworks()`, `useNetwork(id)`, `useCreateNetwork()`,
     `useDeleteNetwork()`, `useAddFirewallRule(networkId)`,
     `useDeleteFirewallRule(networkId)`.
   - Firewall rule mutations invalidate the parent network query.

Scope: `features/network/`, `mocks/data/networks.ts`,
`mocks/handlers/network.ts`, `mocks/browser.ts`.

Acceptance criteria:
- Mock network data (including nested firewall rules, routes, peerings) loads
  correctly.
- `npm run build` succeeds.
````

---

## PR #21 — `feat: Network service — wire dashboard tabs to live data`

````markdown
Wire the Network service's dashboard tabs to live MSW data.

1. In `DashboardPage.tsx`, when `activeService === 'Network'`:
   - Use `useNetworks()` to fetch the network list.
   - Transform into `ServiceRow[]`: vpcName → name, status → status, type → col3,
     cidrBlock → col4, region → col5 (keep the region column visible for networks),
     gateway → col6.
   - Wire loading/error states.

2. Update Info/Details tabs for Network:
   - Info: VPC Name, Type, Status, CIDR Block, Gateway, Region.
   - Details: Created date, number of firewall rules, number of routes, number
     of peering connections — as summary counts.

3. Update `features/dashboard/tabs/NetworkTabContent.tsx`:
   - **Firewall tab**: Replace hardcoded table with data from the selected
     network's `firewallRules` array. Show a table with columns: Name, Direction,
     Protocol, Port, Source, Action (colored: ALLOW=green, DENY=red).
     Add an `[+ Add Rule]` button that opens a `DashboardModal` with a form:
     Name, Direction (TerminalSelect), Protocol (TerminalSelect), Port Range
     (text), Source (text), Action (TerminalSelect: allow/deny). On submit,
     call `useAddFirewallRule()`. Add a delete button per-row that calls
     `useDeleteFirewallRule()` with confirmation.
   - **Routes tab**: Replace hardcoded table with data from the selected
     network's `routes` array. Columns: Destination, Next Hop, Priority,
     Status (colored).
   - **Peering tab**: Replace hardcoded table with data from the selected
     network's `peerings` array. Columns: Peer VPC, Region, CIDR, Status.
     Keep the "Shared Services" info section (DNS resolution, Route export,
     MTU, Encryption) as hardcoded.

4. Wire the Network service menu items:
   - **"Add subnet"**: Navigate to `/services/network/create`.
   - **"Edit firewall"**: Switch to the Firewall tab.
   - **"Create VPN"**: `DashboardModal` — "VPN creation is not available in
     demo mode."
   - **"Delete"**: Confirm modal → `useDeleteNetwork()`.

5. Create `NetworkCreateForm` in `features/network/pages/NetworkCreateForm.tsx`:
   - Fields: VPC Name (text), CIDR Block (text), Type (TerminalSelect:
     vpc/subnet/public).
   - Validation: VPC Name required, CIDR Block required.
   - On success: navigate to `/services/network/details`.

6. Add `/services/network/create` route.

Scope: `DashboardPage.tsx`, `features/dashboard/tabs/NetworkTabContent.tsx`,
`features/network/pages/NetworkCreateForm.tsx`, `features/dashboard/constants.ts`,
`router.tsx`.

Acceptance criteria:
- Network items table shows real data from MSW.
- Firewall tab shows the selected network's rules with working add/delete.
- Routes and Peering tabs show live data.
- Create form works.
- `npm run build` succeeds.
````

---

## PR #22 — `feat: Storage service — data layer + MSW mock API (buckets + files)`

````markdown
Build the Storage service's data layer and mock API. Storage has a two-level
resource shape: buckets containing files.

1. Create `features/storage/types.ts` with interfaces:
   - `StorageFile`: `id`, `bucketId`, `key` (file path/name), `size` (number,
     bytes), `contentType`, `storageClass` ("standard" | "nearline" |
     "coldline" | "archive"), `lastModified` (string).
   - `Bucket`: `id`, `bucketName`, `totalSize` (number, bytes), `objectCount`
     (number), `region`, `access` ("private" | "public-read" |
     "public-read-write"), `versioning` (boolean), `lifecycleEnabled` (boolean),
     `status` ("active" | "archived"), `createdAt`.
   - `CreateBucketInput`: `bucketName`, `region`, `access`.
   - `StorageMetricPoint`: `timestamp`, `totalSize`, `objectCount`,
     `readOps`, `writeOps`.

2. Create `mocks/data/buckets.ts`:
   - Generate 6-8 fake buckets with realistic names ("prod-backups",
     "app-assets", "data-lake-raw", "logs-archive").
   - For each bucket, generate 5-15 fake files with realistic keys
     ("backups/db-2026-08-10.sql.gz", "logs/app-2026-08-10.log.gz").
   - Store files in a separate `Map<bucketId, StorageFile[]>` for the
     `GET /api/buckets/:id/files` endpoint.

3. Create `mocks/handlers/storage.ts` with MSW handlers:
   - `GET /api/buckets` — bucket list.
   - `GET /api/buckets/:id` — single bucket.
   - `POST /api/buckets` — create bucket.
   - `DELETE /api/buckets/:id` — delete bucket.
   - `GET /api/buckets/:id/files` — file list for a bucket.
   - `GET /api/buckets/:id/metrics` — 24-point time series of
     `StorageMetricPoint`.

4. Register handlers in `mocks/browser.ts`.

5. Create `features/storage/api.ts` and `features/storage/hooks.ts`:
   - `useBuckets()`, `useBucket(id)`, `useCreateBucket()`, `useDeleteBucket()`,
     `useBucketFiles(bucketId)`, `useBucketMetrics(bucketId)`.

Scope: `features/storage/`, `mocks/data/buckets.ts`,
`mocks/handlers/storage.ts`, `mocks/browser.ts`.

Acceptance criteria:
- Mock bucket and file data loads correctly.
- `npm run build` succeeds.
````

---

## PR #23 — `feat: Storage service — wire dashboard tabs to live data`

````markdown
Wire the Storage service's dashboard tabs to live MSW data.

1. In `DashboardPage.tsx`, when `activeService === 'Storage'`:
   - Use `useBuckets()` to fetch the bucket list.
   - Transform into `ServiceRow[]`: bucketName → name, status → status,
     access → col3 (capitalize), totalSize (formatted to human readable
     GB/MB/KB) → col4, region → col5, objectCount (as "X objects") → col6.
   - Wire loading/error states.

2. Update Info/Details tabs for Storage:
   - Info: Bucket Name, Access Level, Status, Region, Total Size, Object Count.
   - Details: Created date, Versioning (Enabled/Disabled, colored), Lifecycle
     (Active/Inactive, colored).

3. Update `features/dashboard/tabs/StorageTabContent.tsx`:
   - **Objects tab**: Replace hardcoded table. Fetch files via
     `useBucketFiles(selectedBucketId)`. Show a table with columns: Key
     (file path), Size (human readable), Modified (formatted date),
     Storage Class. Show loading state while fetching. If no bucket is
     selected, show "Select a bucket to view objects".
   - **Access tab**: Replace hardcoded IAM bindings table. Keep the data
     realistic but hardcoded for now (no access policy endpoint exists).
     Add a TODO comment.
   - **Metrics tab**: Wire to `useBucketMetrics(selectedBucketId)`:
     - `AsciiProgressBar` for current Total Size (as percentage of some max,
       e.g. 1TB).
     - Recharts `LineChart` with series: Read Ops, Write Ops, Object Count.
     - Same chart styling as VM/Database metrics.

4. Wire the Storage service menu items:
   - **"Create bucket"**: Navigate to `/services/storage/create`.
   - **"Upload"**: `DashboardModal` — "File upload is not available in demo
     mode."
   - **"Set policy"**: `DashboardModal` — "Policy management coming soon."
   - **"Delete"**: Confirm modal → `useDeleteBucket()`.

5. Create `BucketCreateForm` in `features/storage/pages/BucketCreateForm.tsx`:
   - Fields: Bucket Name (text), Region (TerminalSelect), Access
     (TerminalSelect: private/public-read/public-read-write).
   - Validation: Bucket Name required (lowercase, no spaces — validate with
     regex `/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/`).
   - On success: navigate to `/services/storage/details`.

6. Add `/services/storage/create` route.

Scope: `DashboardPage.tsx`, `features/dashboard/tabs/StorageTabContent.tsx`,
`features/storage/pages/BucketCreateForm.tsx`, `features/dashboard/constants.ts`,
`router.tsx`.

Acceptance criteria:
- Storage items table shows real bucket data from MSW.
- Objects tab shows the selected bucket's files from a separate API call.
- Metrics tab shows live charts.
- Create and delete work.
- Bucket name validation enforces lowercase/no-spaces.
- `npm run build` succeeds.
````

---

# SPRINT 4 — Polish, Auth, Production Readiness

## PR #24 — `fix: consolidate dual styling system and remove dead code`

````markdown
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
````

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

````markdown
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
````

---

## PR #27 — `feat: Dashboard responsive layout (mobile/tablet)`

````markdown
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
````

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

````markdown
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
````

---

## PR #31 — `feat: @tanstack/react-table migration for items table`

````markdown
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
````

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

```
Add integration tests that verify critical CRUD flows work end-to-end through
the MSW mock layer.

1. Install `vitest` and `@testing-library/react` as dev dependencies:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. Configure Vitest in `vite.config.ts`:
   - Add `/// <reference types="vitest/config" />` directive at the top of `vite.config.ts` (or import `defineConfig` from `'vitest/config'`) to ensure `test` property satisfies strict TypeScript typechecking:
     ```ts
     /// <reference types="vitest/config" />
     import { defineConfig } from 'vite'

     export default defineConfig({
       // ...
       test: {
         environment: 'jsdom',
         globals: true,
         setupFiles: ['./src/test/setup.ts'],
       },
     })
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
````

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
````

---

## Quick reference: PR → route map

| PR | Route(s) added/modified |
|---|---|
| #10 | (no route changes — refactor only) |
| #11 | (no new routes — wires VM data into existing `/services/vm/:tab`) |
| #12 | (no new routes — adds mutations) |
| #13 | (no new routes — wires metrics tab) |
| #14 | (no new routes — wires console tab with Xterm) |
| #15 | (no routes — data layer only) |
| #16 | `/services/database/create` |
| #17 | (no new routes — SQL Editor & Data Import tabs) |
| #18 | (no routes — data layer only) |
| #19 | `/services/iam/create` |
| #20 | (no routes — data layer only) |
| #21 | `/services/network/create` |
| #22 | (no routes — data layer only) |
| #23 | `/services/storage/create` |
| #24 | (no new routes — styling consolidation) |
| #25 | (no new routes — toast system) |
| #26 | (no new routes — keyboard shortcuts) |
| #27 | (no new routes — responsive layout) |
| #28 | `/login`, `/callback` (+ protection on all routes) |
| #29 | `*` (404 catch-all) |
| #30 | `/dashboard` (overview page) |
| #31 | (no new routes — table migration) |
| #32 | (no new routes — WebSocket layer) |
| #33 | (no new routes — code splitting) |
| #34 | (no new routes — tests) |
| #35 | (no new routes — deployment) |

## Quick reference: Sprint → PR map

| Sprint | PRs | Theme |
|---|---|---|
| Sprint 0/1 ✅ | #1–#9 | Setup, Theme, Layout, Routing, VM Data Layer |
| Sprint 2B | #10–#14 | Dashboard Hardening & VM Completion |
| Sprint 3 | #15–#23 | Database, IAM, Network, Storage |
| Sprint 4 | #24–#35 | Auth, Polish, Tests, Production |
