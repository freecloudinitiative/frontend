import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'

const DELAY_MIN = 300
const DELAY_MAX = 600

function defaultJitter() {
  return faker.number.int({ min: DELAY_MIN, max: DELAY_MAX })
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
 */
export function createSettingsPatchHandler<T extends object>(
  path: string,
  lookup: (id: string) => T | undefined,
  resourceName: string,
  jitter: () => number = defaultJitter,
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

    return HttpResponse.json({ ...item, settings: body })
  })
}
