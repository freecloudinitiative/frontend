import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'

const DELAY_MIN = 300
const DELAY_MAX = 600

/** Artificial delay range (ms) — makes loading states visible during development. */
export function defaultJitter() {
  return faker.number.int({ min: DELAY_MIN, max: DELAY_MAX })
}

/**
 * Factory function to create MSW GET list-route handlers, optionally
 * filterable by a single query-string field (e.g. `?status=running`).
 */
export function createListHandler<T extends object>(
  path: string,
  getList: () => T[],
  options?: { filterField?: keyof T & string; jitter?: () => number },
) {
  const jitter = options?.jitter ?? defaultJitter
  return http.get(path, async ({ request }) => {
    await delay(jitter())

    let list = getList()
    if (options?.filterField) {
      const url = new URL(request.url)
      const filterValue = url.searchParams.get(options.filterField)
      if (filterValue) {
        list = list.filter((item) => item[options.filterField as keyof T] === filterValue)
      }
    }

    return HttpResponse.json(list)
  })
}

/**
 * Factory function to create MSW GET route handlers by ID.
 */
export function createGetByIdHandler<T extends object>(
  path: string,
  lookup: (id: string) => T | undefined,
  resourceName: string,
  jitter: () => number = defaultJitter,
) {
  return http.get(path, async ({ params }) => {
    await delay(jitter())
    const item = lookup(params.id as string)
    if (!item) {
      return HttpResponse.json({ error: `${resourceName} not found` }, { status: 404 })
    }
    return HttpResponse.json(item)
  })
}

/**
 * Factory function to create MSW DELETE route handlers by ID.
 */
export function createDeleteHandler(
  path: string,
  deleteFn: (id: string) => boolean,
  resourceName: string,
  jitter: () => number = defaultJitter,
) {
  return http.delete(path, async ({ params }) => {
    await delay(jitter())
    const success = deleteFn(params.id as string)
    if (!success) {
      return HttpResponse.json({ error: `${resourceName} not found` }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  })
}

/**
 * Factory function to create MSW PATCH route handlers for resource settings.
 *
 * @param persist - Optional callback invoked with `(id, patchedBody)` to write
 *   the updated record back to the in-memory store. When omitted the handler
 *   returns the merged object without mutating the store.
 */
export function createSettingsPatchHandler<T extends object>(
  path: string,
  lookup: (id: string) => T | undefined,
  resourceName: string,
  jitter: () => number = defaultJitter,
  persist?: (id: string, settings: Record<string, unknown>) => T | undefined,
) {
  return http.patch(path, async ({ params, request }) => {
    await delay(jitter())

    let body: Record<string, unknown> = {}
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      // allow empty body fallback
    }

    const item = lookup(params.id as string)
    if (!item) {
      return HttpResponse.json({ error: `${resourceName} not found` }, { status: 404 })
    }

    const updated = persist ? (persist(params.id as string, body) ?? { ...item, ...body }) : { ...item, settings: body }
    return HttpResponse.json(updated)
  })
}
