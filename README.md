# frontend

## What Code Do

TUI-style single-page application (SPA) for FCI cloud platform.

User log in with OIDC (Authentik). See terminal-aesthetic dashboard.

- **Compute Engines**: Create, view, delete. Start/stop instance. Open terminal session. View CPU/memory/disk metrics.
- **Databases**: Create, view, delete Postgres cluster. See connection string. Run SQL editor. Import CSV/JSON data. View active connections. View metrics.
- **Storage**: Manage bucket. Create, configure firewall rules. View metrics.
- **IAM**: Create/delete user. View activity log.
- **Networks**: Create VPC. View network map.
- **Account**: View profile, API keys, theme, session settings.

Two modes:

- **`nonprod`**: MSW intercepts `/api/*`. Returns mock data. No backend needed. Use for development.
- **`prod`**: Real API calls to `api-gateway`. OIDC required. Terminal uses real WebSocket.

## Language / Deps

TypeScript 6. React 19. Vite 8. No server-side code. Pure browser SPA.

The Monaco SQL editor supports PostgreSQL, MySQL and SQLite. Keep Monaco loaded
through the ESM editor API with only the `pgsql`, `mysql` and generic `sql`
language registrations (`sql` is the SQLite fallback); importing the package
barrel or unrelated language contributions substantially increases the
lazy-loaded editor bundle.

## Folder Where

- `src/app/`: Router, providers.
- `src/components/`: Shared UI (auth, database, editor, terminal, ui).
- `src/features/`: Feature modules (`account`, `computeEngine`, `dashboard`, `database`, `iam`, `network`, `storage`).
- `src/hooks/`: App-wide React hooks.
- `src/lib/`: Utilities (`axios`, OIDC, WebSocket, `queryFactory`).
- `src/mocks/`: MSW handlers, fake data.
- `src/pages/`: Top-level route components.
- `src/store/`: Zustand global stores.
- `src/styles/`: Global CSS.
- `src/test/`: Vitest setup.
- `src/utils/`: File parser, validator.
- `public/`: `config.js`, MSW script, `theme-init.js`, icons.
- `nginx.conf`: Production nginx config.
- `Dockerfile`: Build image.

## Container Image

Production images run on the Raspberry Pi k3s fleet and must target
`linux/arm64`. The Dockerfile pins the nginx runtime stage to `linux/arm64`, so
a plain `docker build` cannot silently create an amd64 runtime image. The Node
build stage intentionally remains on `$BUILDPLATFORM` because the generated
`dist` output is architecture-independent.

Build and load an arm64 image locally with:

```sh
docker buildx build --platform linux/arm64 -t fci-frontend:local --load .
```

## Read More Where

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [API.md](API.md)
- [FILES.md](FILES.md)
