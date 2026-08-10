# Project: TUI Cloud Dashboard (Free Cloud Initiative)

A cloud-console UI (styled like AWS/GCP consoles) but with a Terminal User
Interface (TUI) aesthetic: monospace fonts, terminal color palette, bordered boxes
with floating labels. It is click-friendly (mouse + keyboard both work) but should
visually read as a terminal application, not a typical SaaS dashboard.

The whole app is a single-page dynamic dashboard (`pages/DashboardPage.tsx`): a
grid of service selector boxes, a query/search row, an items-table, and a tabbed
detail panel. Switching the active service swaps the dataset and tabs in place via
flat routing (`/services/:serviceId/:tab`).

## PR Roadmap & Development Plan

Development follows a 34-PR incremental roadmap documented in `implementation_plan.md`
and detailed in `claude-code-pr-prompts.md`.
- **Completed**: PRs #1–#10 (Setup, Layout, Themes, VM Data Layer, PR #10 TabContent Refactoring)
- **Next**: PR #11 (`feat: wire VM items table to MSW data + row detail panel`)

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
- Keep each PR scoped to only the files listed in its prompt in `claude-code-pr-prompts.md`.
- All mock endpoints are handled by MSW in `mocks/`.
