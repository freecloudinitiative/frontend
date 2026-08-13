/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §1.3, §7.2
 *
 * Parameterized across all 5 real base paths against the real MSW handlers, so this suite
 * doubles as a contract test — a mismatch here means createResourceApi generated the wrong
 * URL shape for that resource.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { createResourceApi } from '@/lib/apiResource'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const REAL_BASE_PATHS = [
  '/api/compute-engines',
  '/api/databases',
  '/api/iam/users',
  '/api/networks',
  '/api/buckets',
]

describe.each(REAL_BASE_PATHS)('createResourceApi(%s) — contract against real MSW handlers', (basePath) => {
  it('list() GETs basePath and returns response data', async () => {
    const resource = createResourceApi(basePath)
    const data = await resource.list()
    expect(Array.isArray(data)).toBe(true)
  })

  it('get(id) GETs basePath/:id', async () => {
    const resource = createResourceApi(basePath)
    const [first] = await resource.list()
    const item = await resource.get((first as { id: string }).id)
    expect(item).toMatchObject({ id: (first as { id: string }).id })
  })
})

describe('createResourceApi — request shape (isolated, mocked apiClient transport)', () => {
  it('create(input) POSTs to basePath with the given body', async () => {
    const onRequest = vi.fn()
    server.use(
      http.post('*/api/fake-resource', async ({ request }) => {
        onRequest(await request.json())
        return HttpResponse.json({ id: 'new' }, { status: 201 })
      }),
    )
    const resource = createResourceApi('/api/fake-resource')
    const result = await resource.create({ name: 'test' })
    expect(onRequest).toHaveBeenCalledWith({ name: 'test' })
    expect(result).toEqual({ id: 'new' })
  })

  it('remove(id) DELETEs basePath/:id', async () => {
    const onRequest = vi.fn()
    server.use(
      http.delete('*/api/fake-resource/:id', ({ params }) => {
        onRequest(params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const resource = createResourceApi('/api/fake-resource')
    await resource.remove('abc')
    expect(onRequest).toHaveBeenCalledWith('abc')
  })

  it('patch(id, partial) PATCHes basePath/:id', async () => {
    const onRequest = vi.fn()
    server.use(
      http.patch('*/api/fake-resource/:id', async ({ params, request }) => {
        onRequest(params.id, await request.json())
        return HttpResponse.json({ id: params.id, updated: true })
      }),
    )
    const resource = createResourceApi('/api/fake-resource')
    const result = await resource.patch('abc', { status: 'active' })
    expect(onRequest).toHaveBeenCalledWith('abc', { status: 'active' })
    expect(result).toEqual({ id: 'abc', updated: true })
  })

  it('updateSettings(id, settings) PATCHes basePath/:id/settings', async () => {
    const onRequest = vi.fn()
    server.use(
      http.patch('*/api/fake-resource/:id/settings', async ({ params, request }) => {
        onRequest(params.id, await request.json())
        return HttpResponse.json({ id: params.id, settings: true })
      }),
    )
    const resource = createResourceApi('/api/fake-resource')
    await resource.updateSettings('abc', { region: 'ANK' })
    expect(onRequest).toHaveBeenCalledWith('abc', { region: 'ANK' })
  })

  it('propagates a rejected promise on non-2xx without swallowing the error', async () => {
    server.use(
      http.get('*/api/fake-resource', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    )
    const resource = createResourceApi('/api/fake-resource')
    await expect(resource.list()).rejects.toBeTruthy()
  })
})
