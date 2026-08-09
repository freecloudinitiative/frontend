# Project: TUI Cloud Dashboard (Free Cloud Initiative)

A cloud-console UI (styled like AWS/GCP consoles) but with a Terminal User
Interface (TUI) aesthetic: monospace fonts, terminal color palette, ASCII/box-drawing
borders, square corners. It is click-friendly (mouse + keyboard both work) but should
visually read as a terminal application, not a typical SaaS dashboard.

## Services

VM, Database, IAM, Network, Storage — each gets the same shape of feature:
List view → Detail view → Create/Edit form → (Metrics view, where applicable).
VM additionally gets a Terminal view.

## Tech stack (do not substitute libraries without asking)

- Vite + React + TypeScript (strict mode)
- Tailwind CSS for styling (utility classes; no CSS-in-JS)
- react-router-dom v6 for routing
- zustand for local/UI state (e.g., sidebar open/closed state)
- @tanstack/react-query for all server-state (fetching/caching/mutations)
- @tanstack/react-table for all tabular data (sorting, filtering, pagination)
- axios for HTTP, wrapped in a single instance in `lib/axios.ts`
- recharts for charts (line charts for metrics)
- @xterm/xterm (+ @xterm/addon-fit) for the terminal emulator
- react-oidc-context for authentication (Authentik as IdP)
- msw (Mock Service Worker) for mocked backend endpoints until the real Go backend exists

## Folder structure

- `app/` — providers, router config
- `components/ui/` — shared, generic UI primitives (Panel, Button, Modal, etc.)
- `components/layout/` — Shell, Sidebar, Header
- `components/terminal/` — Xterm.js wrapper components
- `components/auth/` — auth-related components (ProtectedRoute, etc.)
- `features/<service>/` — per-service: `types.ts`, `api.ts`, `hooks.ts`, `pages/`
- `store/` — zustand stores
- `lib/` — axios instance, websocket helper, theme tokens, generic utils
- `mocks/` — MSW handlers and fake data
- `styles/` — global CSS, Tailwind entry point

## Design system

- CSS variables for the terminal palette: `--tui-bg`, `--tui-fg`, `--tui-accent`,
  `--tui-border`, plus status colors (running/green, stopped/red, pending/yellow).
- Monospace font stack applied globally.
- Square borders everywhere (no rounded corners), 1px solid border color `--tui-border`.
- Buttons rendered with bracket styling, e.g. `[ Create ]`, `[ Cancel ]`.
- Every new shared UI primitive goes in `components/ui/` and must be reused by every
  service — do not create a one-off styled button/table/modal inside a feature folder.

## Conventions

- TypeScript everywhere, no `any` unless justified with a comment.
- Every list/detail/create page for every service should feel identical in structure
  and interaction pattern to the VM pages (VM is the reference implementation built
  in Sprint 2). When building Database/IAM/Network/Storage, explicitly reuse the same
  shared components (`Panel`, `StatusBadge`, `Modal`, `QueryState`, `AsciiProgressBar`,
  `Button`) rather than inventing new ones.
- Keep each PR scoped to only the files listed in its "Scope" — do not refactor
  unrelated code in the same PR.
- Backend does not exist yet. All data comes from MSW mock handlers until PR #23
  wires up real auth; the actual Go backend integration is out of scope entirely.
