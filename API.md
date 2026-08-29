# API — How Use Code

The frontend is a browser SPA. It has no HTTP server. This document covers:

1. **Backend API calls** the SPA makes to `api-gateway`.
2. **WebSocket** connection to `terminal-gateway`.
3. **Runtime config** the SPA reads from the host.
4. **Browser events** the SPA fires internally.

All HTTP calls use `axios` with base URL from `runtimeConfig.apiBaseUrl`. All calls include `Authorization: Bearer <oidc-token>` when user is authenticated.

---

## Runtime Config Interface

The SPA reads `window.__FCI_CONFIG__` from `/config.js`. Kubernetes mounts the production values over this file.

```typescript
interface RuntimeConfig {
  appEnv: "nonprod" | "prod";
  apiBaseUrl: string; // e.g. "https://api.example.com"
  oidcAuthority: string; // e.g. "https://auth.example.com/application/o/fci/"
  oidcClientId: string;
  oidcRedirectUri: string; // defaults to current origin + /callback
  enableRealTerminal: boolean; // false = mock shell, true = real WebSocket
  wsBaseUrl: string; // e.g. "wss://console.example.com"
}
```

In `prod` mode, `apiBaseUrl` and `wsBaseUrl` MUST use `https:` / `wss:`. App throws on boot if not.

Empty `wsBaseUrl` is valid — nginx proxies `/ws/` same-origin.

---

## HTTP API Calls

All calls relative to `apiBaseUrl`.

### Account

| Method | Path                            | What                                    |
| ------ | ------------------------------- | --------------------------------------- |
| GET    | `/api/account`                  | Fetch account profile                   |
| PATCH  | `/api/account/settings`         | Update display name, email, theme, etc. |
| POST   | `/api/account/api-keys`         | Generate new API key                    |
| DELETE | `/api/account/api-keys/{keyId}` | Revoke API key                          |

### Compute Engines

| Method | Path                                 | What                    |
| ------ | ------------------------------------ | ----------------------- |
| GET    | `/api/compute-engines`               | List all instances      |
| POST   | `/api/compute-engines`               | Create instance         |
| GET    | `/api/compute-engines/{id}`          | Get single instance     |
| PATCH  | `/api/compute-engines/{id}`          | Update name/status/spec |
| DELETE | `/api/compute-engines/{id}`          | Delete instance         |
| PATCH  | `/api/compute-engines/{id}/settings` | Update settings         |
| GET    | `/api/compute-engines/{id}/metrics`  | Time-series metrics     |

### Databases

| Method | Path                              | What                                         |
| ------ | --------------------------------- | -------------------------------------------- |
| GET    | `/api/databases`                  | List all databases                           |
| POST   | `/api/databases`                  | Create database                              |
| GET    | `/api/databases/{id}`             | Get single database (full connection string) |
| PATCH  | `/api/databases/{id}`             | Update name/cpu/memory/storage/status        |
| DELETE | `/api/databases/{id}`             | Delete database                              |
| PATCH  | `/api/databases/{id}/settings`    | Update settings                              |
| GET    | `/api/databases/{id}/metrics`     | Time-series metrics                          |
| GET    | `/api/databases/{id}/connections` | List active database connections             |
| POST   | `/api/databases/{id}/execute-sql` | Execute SQL script                           |
| POST   | `/api/databases/{id}/import-data` | Import CSV or JSON file                      |

### Storage

| Method | Path                                | What                   |
| ------ | ----------------------------------- | ---------------------- |
| GET    | `/api/buckets`                      | List buckets           |
| POST   | `/api/buckets`                      | Create bucket          |
| GET    | `/api/buckets/{id}`                 | Get bucket             |
| DELETE | `/api/buckets/{id}`                 | Delete bucket          |
| PATCH  | `/api/buckets/{id}/settings`        | Update settings        |
| GET    | `/api/buckets/{id}/files`           | List objects in bucket |
| GET    | `/api/buckets/{id}/metrics`         | Metrics                |
| GET    | `/api/buckets/{id}/access-policies` | Firewall rules         |

### IAM

| Method | Path                           | What                  |
| ------ | ------------------------------ | --------------------- |
| GET    | `/api/iam/users`               | List IAM users        |
| POST   | `/api/iam/users`               | Create IAM user       |
| GET    | `/api/iam/users/{id}`          | Get user              |
| PATCH  | `/api/iam/users/{id}`          | Update roles/policies |
| DELETE | `/api/iam/users/{id}`          | Delete user           |
| GET    | `/api/iam/users/{id}/activity` | Audit log             |

### Networks

| Method | Path                          | What            |
| ------ | ----------------------------- | --------------- |
| GET    | `/api/networks`               | List networks   |
| POST   | `/api/networks`               | Create network  |
| GET    | `/api/networks/{id}`          | Get network     |
| DELETE | `/api/networks/{id}`          | Delete network  |
| PATCH  | `/api/networks/{id}/settings` | Update settings |

---

## SQL Execution

`POST /api/databases/{id}/execute-sql`

**Request**:

```json
{ "script": "SELECT * FROM orders LIMIT 10;" }
```

**Response** (`success: true`):

```json
{
  "success": true,
  "resultData": [{ "id": 1, "name": "Alice" }],
  "executedAt": "2026-01-01T00:00:00Z"
}
```

**Response** (SQL error — still HTTP 200):

```json
{
  "success": false,
  "errorMessage": "column \"x\" does not exist",
  "executedAt": "2026-01-01T00:00:00Z"
}
```

The SPA always checks `response.success`, not the HTTP status code. SQL errors are rendered inline in the editor, not as toast notifications.

---

## Data Import

`POST /api/databases/{id}/import-data`

**Request**: `multipart/form-data`

```javascript
const formData = new FormData();
formData.append("file", file); // binary
formData.append(
  "options",
  JSON.stringify({
    // JSON string
    tableName: "orders",
    delimiter: ",",
    hasHeaders: true,
    mode: "insert", // insert | upsert | replace
  }),
);
// Do NOT set Content-Type — axios sets it with boundary automatically
```

**Response** (`success: true`):

```json
{ "success": true, "rowsImported": 4200 }
```

**Response** (data error — still HTTP 200):

```json
{ "success": false, "errorMessage": "duplicate key value..." }
```

---

## WebSocket — Terminal

Used only when `enableRealTerminal: true`.

URL pattern:

```
{wsBaseUrl}/ws/terminal/{computeEngineId}
```

Example:

```
wss://console.example.com/ws/terminal/abc-123
```

The SPA creates a `TerminalWebSocket` instance (see `lib/websocket.ts`). It:

- Connects on mount.
- Reconnects on unexpected close: exponential back-off (1 s, 2 s, 4 s), max 3 retries.
- Buffers up to 100 typed characters while reconnecting.
- `disconnect()` on component unmount — suppresses reconnect.

Binary frame protocol is defined by `terminal-gateway`. The SPA sends raw xterm.js output bytes and receives ANSI terminal data.

When `enableRealTerminal: false`, the SPA renders a mock shell (`components/terminal/mockShell.ts`) with simulated responses.

---

## Error Handling

Backend error envelope:

```json
{
  "error": {
    "code": "invalid_input",
    "message": "name must be a DNS-1123 label",
    "request_id": "req-xyz",
    "details": { "name": "too long" }
  }
}
```

`lib/apiError.ts` provides:

| Function                              | Returns                                                               |
| ------------------------------------- | --------------------------------------------------------------------- |
| `getApiErrorMessage(error, fallback)` | Human-readable string. Falls back to `error.message` then `fallback`. |
| `getApiErrorCode(error)`              | Machine-readable code string or `null`.                               |
| `getApiErrorRequestId(error)`         | Request ID string or `null`.                                          |

On `401`: axios clears the auth token and fires `fci:auth-unauthorized` DOM event. OIDC provider handles redirect.

---

## Browser Events

| Event                   | When                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `fci:auth-unauthorized` | Fired on `window` when any API call returns 401. OIDC layer listens and redirects to login. |

---

## Public-API Constraint Fixtures

`src/lib/apiConstraints.ts` is the frontend's contract guard for the
customer-facing `/api/*` endpoints.

**What it is.** One exported const per resource — compute engine, database,
bucket, network, IAM user — holding numeric ranges (`{ min, max }`) and enum
lists. Every value is transcribed from the Go validator that the backend
actually enforces. Each value has a trailing comment naming the exact
`file.go:line` it came from.

**Why it exists.** The three create-form regressions fixed in pr-01 through
pr-03 passed 970 tests because MSW — the only counterparty in test — validated
nothing the Go handlers validate. `apiConstraints.ts` is the public-endpoint
equivalent of the shared JSON fixtures the internal service-to-service
contracts use (`iam-service/internal/contract/testdata/`,
`api-gateway/internal/contract/testdata/`). The tests in
`src/lib/__tests__/apiConstraints.test.ts` assert that every form option list
and default satisfies the constraint, and that enum lists match exactly.

**Rules — caveman style.**

1. These constants are **transcribed, not generated.** Do not point a script
   at the Go source; read it and copy the value with its source reference.
2. Any change to a Go range or enum **must update `apiConstraints.ts` in the
   same change set.** Never update only one side.
3. Any new create form **must have a corresponding constraint block** in
   `apiConstraints.ts` and coverage in `apiConstraints.test.ts` before merging.
4. MSW handlers must reference `apiConstraints` for the values they validate,
   not duplicate them locally. One definition, two consumers — the mock cannot
   drift from what the tests assert.
5. If `apiConstraints.test.ts` fails, the constant was transcribed wrong.
   Re-check the Go source. **Do not adjust the assertion to make it pass.**

---

## Don't Do This

**Don't hardcode `Content-Type: multipart/form-data` for file uploads.** axios must set it automatically to include the boundary. Hardcoded header produces unparseable request.

**Don't check HTTP status for SQL execution or import.** Both return HTTP 200 even on data errors. Always check `response.success`.

**Don't set `wsBaseUrl` to an `http://` or `ws://` URL in production.** Production config validation rejects it. Use `wss://`.

**Don't put secrets in `VITE_*` env vars.** Vite bakes them into the JS bundle. Secrets must come from the Kubernetes-mounted `/config.js` at runtime.

**Don't rely on OIDC config being present.** When `oidcAuthority` or `oidcClientId` is missing, OIDC is disabled — the SPA runs in pass-through mode with no auth. This is intentional for local dev, not acceptable in production.

**Don't skip `offline_access` scope.** Without it, the refresh token is missing and sessions die at access-token expiry. `automaticSilentRenew` falls back to hidden iframes that CSP blocks.

**Don't call `buildTerminalWsUrl` at module scope.** `window.__FCI_CONFIG__` may not yet be set. Call it at connect time (inside component effects or event handlers).

**Don't add `VITE_APP_ENV=prod` for local dev.** In prod mode, MSW is disabled and the app hits the real backend. Use `nonprod` for local work.
