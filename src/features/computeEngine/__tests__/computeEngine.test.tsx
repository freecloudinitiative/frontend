/**
 * PR #34 — critical-flow integration test for the Compute Engine service.
 * Exercises the real hooks against the real MSW handlers end-to-end
 * (list -> create -> appears in list -> delete -> gone), rather than
 * testing each hook in isolation (see hooks.test.tsx for that).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { http, HttpResponse, delay } from 'msw'
import { server } from '@/test/server'
import { getComputeEngines } from '@/mocks/data/computeEngines'
import { useComputeEngines, useCreateComputeEngine, useDeleteComputeEngine, useComputeEngineMetrics } from '@/features/computeEngine/hooks'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('Compute Engine — critical CRUD flow through MSW', () => {
  it('creates a Compute Engine, sees it update in the mounted list, then deletes it and sees it disappear (cache invalidation)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const list = renderHook(() => useComputeEngines(), { wrapper })
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true))
    expect(list.result.current.data!.length).toBeGreaterThanOrEqual(9)
    const countBefore = list.result.current.data!.length

    const create = renderHook(() => useCreateComputeEngine(), { wrapper })
    create.result.current.mutate({
      name: 'flow-test-ce',
      cpu: 2,
      memory: 4096,
      disk: 50,
      os: 'Debian 12',
      region: 'ANK',
    })
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true))
    const createdId = create.result.current.data!.id
    expect(create.result.current.data!.name).toBe('flow-test-ce')
    expect(create.result.current.data!.status).toBe('pending')

    await waitFor(() => expect(list.result.current.data!.length).toBe(countBefore + 1))
    expect(list.result.current.data!.some((computeEngine) => computeEngine.id === createdId)).toBe(true)

    const del = renderHook(() => useDeleteComputeEngine(), { wrapper })
    del.result.current.mutate(createdId)
    await waitFor(() => expect(del.result.current.isSuccess).toBe(true))

    await waitFor(() => expect(list.result.current.data!.length).toBe(countBefore))
    expect(list.result.current.data!.some((computeEngine) => computeEngine.id === createdId)).toBe(false)
  })

  it('fetches a 30-point metric series for an existing Compute Engine, in chronological order', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const computeEngines = renderHook(() => useComputeEngines(), { wrapper })
    await waitFor(() => expect(computeEngines.result.current.isSuccess).toBe(true))
    const id = computeEngines.result.current.data![0].id

    const { result } = renderHook(() => useComputeEngineMetrics(id, '1h'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.length).toBe(30)
    const point = result.current.data![0]
    expect(typeof point.cpu).toBe('number')
    expect(typeof point.memory).toBe('number')
    expect(typeof point.disk).toBe('number')
    expect(typeof point.timestamp).toBe('string')

    const timestamps = result.current.data!.map((p) => new Date(p.timestamp).getTime())
    const sorted = [...timestamps].sort((a, b) => a - b)
    expect(timestamps).toEqual(sorted)
  })
})

// ---------------------------------------------------------------------------
// Error handling — useComputeEngines() surfaces a server error, and a subsequent
// refetch (after the handler override is lifted) recovers.
// ---------------------------------------------------------------------------

describe('useComputeEngines() — error handling and recovery', () => {
  it('enters an error state on a 500 response, then recovers on refetch', async () => {
    server.use(
      http.get('*/api/compute-engines', () => HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })),
    )

    const { result } = renderHook(() => useComputeEngines(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()

    server.resetHandlers()
    result.current.refetch()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.length).toBeGreaterThanOrEqual(9)
  })
})

// ---------------------------------------------------------------------------
// React Query caching — a second useComputeEngines() call sharing the same QueryClient
// reads from cache instead of firing a new network request.
// ---------------------------------------------------------------------------

describe('useComputeEngines() — query caching', () => {
  it('serves a second render from cache, then refetches on demand', async () => {
    let requestCount = 0
    server.use(
      http.get('*/api/compute-engines', async () => {
        requestCount++
        await delay(10)
        return HttpResponse.json(getComputeEngines())
      }),
    )

    // staleTime: Infinity — otherwise React Query's default staleTime of 0
    // triggers a background refetch on every new mount, which would make
    // the request count in this test non-deterministic.
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const first = renderHook(() => useComputeEngines(), { wrapper })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    expect(requestCount).toBe(1)

    const second = renderHook(() => useComputeEngines(), { wrapper })
    expect(second.result.current.isLoading).toBe(false)
    expect(second.result.current.data).toEqual(first.result.current.data)
    expect(requestCount).toBe(1)

    second.result.current.refetch()
    await waitFor(() => expect(requestCount).toBe(2))
  })
})

// ---------------------------------------------------------------------------
// Async timeout handling — waitFor rejects when the condition never
// becomes true within its timeout window.
// ---------------------------------------------------------------------------

describe('useComputeEngines() — waitFor timeout handling', () => {
  it('rejects waitFor when the query never resolves in time', async () => {
    server.use(
      http.get('*/api/compute-engines', async () => {
        await delay(10_000)
        return HttpResponse.json(getComputeEngines())
      }),
    )

    const { result } = renderHook(() => useComputeEngines(), { wrapper: makeWrapper() })
    await expect(
      waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 300 }),
    ).rejects.toThrow()
  })
})
