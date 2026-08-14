# PR-01 — refactor: migrate API error handling to the structured envelope

**Repo:** frontend · **Sprint:** pre-backend · **Depends on:** none · **Blocks:** every backend PR that returns an error response

---

## Context

`frontend` is the Free Cloud Initiative console: a Vite + React 19 + TypeScript SPA with a
terminal-UI aesthetic. All server state goes through TanStack Query; all HTTP goes through a
single axios instance in `src/lib/axios.ts`. During local development, `msw` intercepts every
request and serves fixtures from `src/mocks/`.

The Go backend services (built in the sibling `platform-common`, `api-gateway`,
`iam-service`, `compute-service`, `database-service`, `storage-service` and
`terminal-gateway` repos) will return a **structured error envelope**:

```json
{
  "error": {
    "code": "resource_not_found",
    "message": "compute engine not found",
    "request_id": "01JD2Q8XKZ3F4V5N6M7P8Q9R0S",
    "details": {}
  }
}
```

The SPA today assumes `response.data.error` is a **plain string**. If a backend returns the
new shape against the current code, `errorMessage` becomes an object, React attempts to
render an object as a child, and the component throws
`Objects are not valid as a React child`. This is a hard crash, not a degraded message.

This PR migrates the frontend to the new shape **before** any backend is pointed at it. It
is the sequencing prerequisite for the entire backend programme.

---

## Required reading

- `src/lib/axios.ts` — the shared axios instance; the new helper belongs here
- `src/features/database/sections/DataImportSection.tsx` — call site 1 (around line 59–62)
- `src/features/database/sections/SqlEditorSection.tsx` — call site 2 (around line 85–90)
- `src/mocks/handlers/utils.ts` — three shared factories that emit error bodies
- `src/features/iam/__tests__/msw-handlers.test.ts` — asserts `typeof data.error === 'string'` twice
- `CLAUDE.md` — project conventions: strict TypeScript, no `any`, do not substitute libraries

---

## Objective

Introduce a single `getApiErrorMessage()` helper, route both existing call sites through it,
migrate all 75 MSW error bodies to the structured envelope, and update the two tests — so
the SPA renders backend errors correctly and the mocks remain an accurate specification of
what the backend will send.

---

## Files to create

### `src/lib/apiError.ts`

Define the wire type and a total, defensive accessor. This file must have **no imports from
axios** so it stays trivially unit-testable.

```ts
export interface ApiErrorEnvelope {
  code: string
  message: string
  request_id?: string
  details?: Record<string, unknown>
}

/** Type guard for the structured envelope: `{ error: { code, message, ... } }`. */
export function isApiErrorEnvelope(value: unknown): value is { error: ApiErrorEnvelope }

/**
 * Extracts a human-readable message from any thrown value.
 * Resolution order:
 *   1. structured envelope   -> error.error.message
 *   2. legacy string body    -> error.response.data.error   (string only)
 *   3. axios/Error message   -> error.message
 *   4. the provided fallback
 * Never returns a non-string. Never throws.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string

/** Returns the machine-readable code when present, else null. */
export function getApiErrorCode(error: unknown): string | null

/** Returns the request ID when present, else null. Used for support/debug display. */
export function getApiErrorRequestId(error: unknown): string | null
```

Implementation requirements:

- Step 2 (legacy string) is retained deliberately. MSW handlers and the real backend will not
  flip in the same instant, and a bare `500` from nginx or Traefik has neither shape. The
  helper must degrade cleanly through all four steps.
- Guard every property access — `error` may be `undefined`, a string, a `DOMException` from an
  aborted request, or a network error with no `response` at all.
- `getApiErrorMessage` must **always** return a `string`. This is the invariant that prevents
  the React-child crash; assert it in tests.

---

## Files to modify

### `src/lib/axios.ts`

In the response interceptor (currently logging under `if (import.meta.env.DEV)`), add the
error code and request ID to the existing `console.error` payload so failures are traceable
to a backend log line:

```ts
console.error('[apiClient] Request failed:', {
  url: error.config?.url,
  status: error.response?.status,
  code: getApiErrorCode(error),
  requestId: getApiErrorRequestId(error),
  message: error.message,
})
```

Do **not** transform the error or change what is rejected — TanStack Query and the existing
`fci:auth-unauthorized` dispatch on 401 must behave exactly as before.

### `src/features/database/sections/DataImportSection.tsx`

Replace the inline cast in the `onError` handler:

```ts
// remove
const errorMessage =
  (error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Import failed'
// with
const errorMessage = getApiErrorMessage(error, 'Import failed')
```

### `src/features/database/sections/SqlEditorSection.tsx`

Same substitution in its `onError`, preserving the existing fallback chain semantics:

```ts
const errorMessage = getApiErrorMessage(error, 'Query failed')
```

The current code falls back to `error?.message` before `'Query failed'`; `getApiErrorMessage`
already does that at step 3, so the explicit `error?.message` term is removed.

### `src/mocks/handlers/utils.ts`

Add a shared builder and use it in all three factories:

```ts
export function errorBody(code: string, message: string, details?: Record<string, unknown>) {
  return {
    error: {
      code,
      message,
      request_id: `msw-${crypto.randomUUID()}`,
      ...(details ? { details } : {}),
    },
  }
}
```

Then replace the three inline `{ error: \`${resourceName} not found\` }` bodies in
`createGetByIdHandler`, `createDeleteHandler` and `createSettingsPatchHandler` with
`errorBody('resource_not_found', \`${resourceName} not found\`)`.

### `src/mocks/handlers/*.ts` — all 75 error bodies

Migrate every `HttpResponse.json({ error: '…' }, { status: N })` to
`HttpResponse.json(errorBody(code, '…'), { status: N })`. Counts per file, to confirm you
have found them all:

| File | Bodies |
|---|---|
| `account.ts` | 2 |
| `computeEngine.ts` | 10 |
| `database.ts` | 22 |
| `iam.ts` | 12 |
| `network.ts` | 17 |
| `storage.ts` | 9 |
| `utils.ts` | 3 |
| **total** | **75** |

Use this code mapping, which must match what the Go services will emit
(`platform-common` PR-04 defines the same set):

| HTTP status | `code` |
|---|---|
| 400 — malformed body / bad enum / missing field | `invalid_input` |
| 403 | `forbidden` |
| 404 | `resource_not_found` |
| 409 | `conflict` |
| 429 | `rate_limited` |

Keep every existing `message` string and every existing HTTP status **exactly as they are**.
This PR changes the envelope, not the wording or the status codes — mixing the two makes the
diff unreviewable.

### `src/features/iam/__tests__/msw-handlers.test.ts`

Update the two assertions (around lines 85–86 and 152–153):

```ts
const data = await res.json() as { error: { code: string; message: string } }
expect(typeof data.error.message).toBe('string')
expect(data.error.code).toBe('resource_not_found')  // 'invalid_input' for the 400 case
```

---

## Implementation notes

- **Do not** change any success-path response shape. The SPA's list endpoints must keep
  returning bare JSON arrays — `(data ?? []).find(…)` in several components throws
  `.find is not a function` against an object.
- **Do not** introduce a global error toast in this PR. `src/features/dashboard/Toast.tsx`
  exists and several mutations already handle their own errors; changing that is a separate
  concern.
- Call sites using `error instanceof Error ? error.message : '…'` (there are several in
  `src/features/dashboard/useDashboardModals.ts`) read the axios `Error.message`, not the
  response body. They are **unaffected** — leave them alone. Migrating them to
  `getApiErrorMessage` is a reasonable follow-up but expands this diff past the point of
  easy review.
- `crypto.randomUUID()` is available in both jsdom (Node 19+) and all target browsers. If the
  test environment complains, fall back to a counter — the mock request ID only has to be
  unique within a session.
- Strict TypeScript, no `any`. Use `unknown` plus narrowing in the type guards.

---

## Tests

### `src/lib/__tests__/apiError.test.ts` (new)

Table-driven over `getApiErrorMessage`, one case per row:

| Input | Expected |
|---|---|
| `{response:{data:{error:{code:'x',message:'boom'}}}}` | `'boom'` |
| `{response:{data:{error:'legacy string'}}}` | `'legacy string'` |
| `{response:{data:{}}, message:'Request failed'}` | `'Request failed'` |
| `{response:{status:502}}` (HTML body, no data) | fallback |
| `new Error('network down')` | `'network down'` |
| `undefined` | fallback |
| `'a bare string'` | fallback |
| `{response:{data:{error:{message:null}}}}` | fallback (message not a string) |

Add an explicit assertion that **every** case returns `typeof result === 'string'` — that is
the invariant protecting against the React-child crash.

Cover `getApiErrorCode` and `getApiErrorRequestId` returning `null` for the legacy and
absent shapes.

### Existing suites

`src/features/iam/__tests__/msw-handlers.test.ts` — updated as above. Every other suite
should pass **unchanged**; if one fails, it is asserting on an error body you have migrated,
and it needs the same treatment.

---

## Acceptance criteria

- [ ] `npm run test:ci` passes (runs `tsc -b && vite build`, then `oxlint`, then all tests)
- [ ] Test count is at least the current 827, plus the new `apiError` cases
- [ ] `grep -rn "data?: { error?: string }" src/` returns **no matches**
- [ ] `grep -rc "{ error: '" src/mocks/handlers/*.ts` sums to **0** (all migrated to `errorBody`)
- [ ] `getApiErrorMessage` provably returns a string for every input in the table above
- [ ] Manual check: with `npm run dev`, open the SQL Editor tab, run a query against a
      non-existent database ID, and confirm the inline error renders text rather than
      crashing the tab

---

## Out of scope

- Displaying `request_id` in the UI (useful for support, but a design decision — later)
- Migrating the `error instanceof Error` call sites in `useDashboardModals.ts`
- Any global error-toast behaviour
- Changing HTTP status codes or error message wording
- Retry/backoff policy changes in TanStack Query
