# Project: TUI Cloud Dashboard (Free Cloud Initiative)

A cloud-console UI (styled like AWS/GCP consoles) but with a Terminal User
Interface (TUI) aesthetic: monospace fonts, terminal color palette, bordered boxes
with floating labels. It is click-friendly (mouse + keyboard both work) but should
visually read as a terminal application, not a typical SaaS dashboard.

The whole app is currently a single dynamic screen (`pages/DashboardPage.tsx`): a
grid of service selector boxes, a query/search row, and a two-pane items-table +
detail-panel layout. Switching the active service swaps the table's dataset and
the detail panel's field labels in place — there is no per-service routing/page.

## Services

VM, Database, Security, Network, IAM — each has a mock dataset in
`lib/mockServiceData.ts` (headers, rows, per-value status/type colors, and the
field-label mapping used by the detail panel). Real data still doesn't exist;
extend `mockServiceData.ts` rather than wiring a backend.

## Tech stack (do not substitute libraries without asking)

- Vite + React + TypeScript (strict mode)
- Tailwind CSS for utility classes; the dashboard's exact bordered-box aesthetic
  (`pages/tui-dashboard.css`) is plain CSS, not Tailwind or CSS-in-JS — see
  "Design system" below for why
- react-router-dom v6 for routing
- zustand for local/UI state
- @tanstack/react-query for all server-state (fetching/caching/mutations)
- @tanstack/react-table for all tabular data (sorting, filtering, pagination)
- axios for HTTP, wrapped in a single instance in `lib/axios.ts`
- recharts for charts (line charts for metrics)
- @xterm/xterm (+ @xterm/addon-fit) for the terminal emulator
- react-oidc-context for authentication (Authentik as IdP)
- msw (Mock Service Worker) for mocked backend endpoints until the real Go backend exists

## Folder structure

- `app/` — providers, router config (`router.tsx`), `/ui-preview` harness
- `components/ui/` — `Panel`, `Button`, `StatusBadge`: a generic rounded
  box-drawing primitive set, used only by `/ui-preview` today (see Design system)
- `components/terminal/` — Xterm.js wrapper components
- `components/auth/` — auth-related components (ProtectedRoute, etc.)
- `pages/` — `DashboardPage.tsx` (the whole app) plus its scoped
  `tui-dashboard.css`
- `features/<service>/` — reserved for when services grow beyond the dashboard's
  inline table + detail panel (types.ts, api.ts, hooks.ts, pages/)
- `store/` — zustand stores
- `lib/` — `mockServiceData.ts` (per-service datasets), theme tokens, generic utils
- `mocks/` — MSW handlers and fake data
- `styles/` — global CSS, Tailwind entry point

## Design system

There are two parallel styling systems right now — know which one you're touching:

1. **The dashboard** (`pages/DashboardPage.tsx` + `pages/tui-dashboard.css`): the
   real product UI. Pure black background (`#000000`), muted blue borders
   (`#3a6ea5`), light-blue box labels (`#4fa8dc`), amber keybinding hints and the
   active-service border/label (`#e8a020`), off-white body text (`#dcdcdc`). Boxes
   are real CSS-bordered elements with an absolutely-positioned label overlapping
   the top border and an optional keybinding hint overlapping the bottom-right —
   not hand-drawn Unicode box-drawing glyphs. Status/type values are colored
   per-value via lookup maps in `mockServiceData.ts` (`statusColors`, `col3Colors`),
   not by a fixed palette. Class names are prefixed `fci-` and defined in
   `tui-dashboard.css`; extend that file rather than reaching for Tailwind
   utilities here, so the exact visual spec stays in one place.
2. **`components/ui/` primitives** (`Panel`, `Button`, `StatusBadge`) + `/ui-preview`:
   an earlier rounded box-drawing system (`╭─╮`/`╰─╯` glyphs, Tailwind utilities,
   `--tui-*` CSS variables in `styles/globals.css`). Nothing in the dashboard uses
   these anymore. Don't extend the dashboard with them; if a shared primitive is
   ever needed again, prefer matching the dashboard's CSS approach over reviving
   the glyph-based one.
- Monospace font stack (`'Courier New', Courier, monospace` on the dashboard;
  `styles/globals.css` sets a broader stack for the `/ui-preview` primitives).

## Conventions

- TypeScript everywhere, no `any` unless justified with a comment.
- Keep each PR scoped to only the files listed in its "Scope" — do not refactor
  unrelated code in the same PR.
- Backend does not exist yet. All data comes from `lib/mockServiceData.ts` (or MSW
  handlers, once added) until PR #23 wires up real auth; the actual Go backend
  integration is out of scope entirely.
