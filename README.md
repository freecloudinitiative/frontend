# Free Cloud Initiative

A terminal-style cloud management dashboard built with React, TypeScript, Tailwind CSS, and Vite.

<!-- ![screenshot](docs/screenshot.png) -->

## What it is

- A TUI-inspired UI for cloud services such as VMs, databases, storage, networking, and IAM.
- Uses monospace styling, square borders, and terminal palette tokens for a console look.
- Uses MSW for mocked backend data until real backend integration is available.

## Tech stack

- Vite + React + TypeScript (strict mode)
- Tailwind CSS
- React Router DOM
- Zustand for UI state
- TanStack Query for data fetching
- TanStack Table for tables
- Recharts for charts
- XTerm.js for terminal emulation
- react-oidc-context for OIDC authentication (Authentik)
- MSW for local API mocking
- axios for HTTP

## Project structure

- `src/app/` - app providers and router configuration
- `src/components/` - shared UI primitives, layout, auth, and terminal components
- `src/features/` - service-specific pages and hooks
- `src/lib/` - utilities, theme tokens, and axios setup
- `src/mocks/` - MSW handlers and fake backend data
- `src/store/` - local UI state stores
- `src/styles/` - global styles and Tailwind entrypoint

## Development setup

Requires Node.js 20+.

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default, using MSW to mock all backend endpoints.

Other useful scripts:

```bash
npm run build   # tsc -b && vite build — production build
npx oxlint .    # lint the codebase
npm test        # vitest run — MSW integration tests
```

## Environment variables

Copy `.env.example` to `.env` and adjust as needed for local development. See `.env.example` for the full, up-to-date list with inline comments.

### Build-time (`VITE_*`, baked into the bundle via Docker `--build-arg` or a local `.env` file)

| Variable                    | Description                                                                                   | Default (unset)                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------- |
| `VITE_API_BASE_URL`          | Base URL for the backend API.                                                                  | `""` (same-origin, required for MSW)  |
| `VITE_OIDC_AUTHORITY`        | Authentik OIDC issuer URL. Leave unset (with `VITE_OIDC_CLIENT_ID`) to disable auth.           | unset (auth disabled)                 |
| `VITE_OIDC_CLIENT_ID`        | OIDC client ID registered with the IdP.                                                        | unset (auth disabled)                 |
| `VITE_OIDC_REDIRECT_URI`     | OIDC callback URL registered with the IdP.                                                     | `${origin}/callback`                  |
| `VITE_WS_BASE_URL`           | WebSocket base URL for the real terminal backend.                                              | `ws://localhost:8080`                 |
| `VITE_ENABLE_REAL_TERMINAL`  | Set to `true` to use a real backend WebSocket terminal instead of the mock shell.               | `false` (mock shell)                  |

### Runtime (container environment, resolved by Nginx at container startup)

| Variable          | Description                                              | Default             |
| ------------------ | ---------------------------------------------------------- | ---------------------- |
| `API_BACKEND_URL`  | Backend origin that `/api/` requests are proxied to.      | `http://backend:8080` |

## Docker

Build the production image, passing build-time vars as `--build-arg`:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  --build-arg VITE_OIDC_AUTHORITY=https://auth.example.com/application/o/fci/ \
  --build-arg VITE_OIDC_CLIENT_ID=your-client-id \
  --build-arg VITE_OIDC_REDIRECT_URI=https://app.example.com/callback \
  --build-arg VITE_WS_BASE_URL=wss://ws.example.com \
  --build-arg VITE_ENABLE_REAL_TERMINAL=true \
  -t fci-frontend .
```

Run the container, passing the runtime var as `-e`. For Nginx to resolve `backend` by name, the frontend and backend containers must share a user-defined network:

```bash
docker network create fci-net   # skip if the network already exists
docker run -d --name backend --network fci-net ...   # your backend container
docker run -p 8080:80 --network fci-net -e API_BACKEND_URL=http://backend:8080 fci-frontend
```

The app serves at `http://localhost:8080`. Nginx handles SPA routing (all non-file paths fall back to `index.html`) and proxies `/api/` to `API_BACKEND_URL`.

## Notes

This repo is intended as a frontend prototype with mocked backend data and terminal-inspired UX styling.
