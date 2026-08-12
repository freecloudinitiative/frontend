/**
 * Compute Engine React Query hooks integration tests.
 * useComputeEngineMetrics with MetricRange.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { getComputeEngines as getMockComputeEngines } from '@/mocks/data/computeEngines'
import {
  useComputeEngines,
  useComputeEngine,
  useCreateComputeEngine,
  useDeleteComputeEngine,
  useUpdateComputeEngine,
  useComputeEngineMetrics,
  computeEngineKeys,
} from '@/features/computeEngine/hooks'

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

// ---------------------------------------------------------------------------
// Query key constants
// ---------------------------------------------------------------------------

describe('Compute Engine query key constants', () => {
  it('computeEngineKeys.all is ["compute-engines"]', () => {
    expect(computeEngineKeys.all).toEqual(['compute-engines'])
  })

  it('computeEngineKeys.detail(id) is ["compute-engines", id]', () => {
    expect(computeEngineKeys.detail('abc')).toEqual(['compute-engines', 'abc'])
  })

  it('computeEngineKeys.metrics(id, range) is ["compute-engines", id, "metrics", range]', () => {
    expect(computeEngineKeys.metrics('abc', '1h')).toEqual(['compute-engines', 'abc', 'metrics', '1h'])
  })
})

// ---------------------------------------------------------------------------
// useComputeEngines
// ---------------------------------------------------------------------------

describe('useComputeEngines()', () => {
  it('starts loading then resolves with 9+ Compute Engines', async () => {
    const { result } = renderHook(() => useComputeEngines(), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.length).toBeGreaterThanOrEqual(9)
  })

  it('each Compute Engine has status and region', async () => {
    const { result } = renderHook(() => useComputeEngines(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const computeEngine = result.current.data![0]
    expect(['running', 'stopped', 'pending']).toContain(computeEngine.status)
    expect(['ANK', 'IST']).toContain(computeEngine.region)
  })
})

// ---------------------------------------------------------------------------
// useComputeEngine
// ---------------------------------------------------------------------------

describe('useComputeEngine(id)', () => {
  it('fetches single Compute Engine by ID', async () => {
    const id = getMockComputeEngines()[0].id
    const { result } = renderHook(() => useComputeEngine(id), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.id).toBe(id)
  })

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(() => useComputeEngine(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('enters error state for nonexistent ID', async () => {
    const { result } = renderHook(() => useComputeEngine('no-such-ce-hook'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// useCreateComputeEngine
// ---------------------------------------------------------------------------

describe('useCreateComputeEngine()', () => {
  it('creates Compute Engine in pending status', async () => {
    const { result } = renderHook(() => useCreateComputeEngine(), { wrapper: makeWrapper() })
    result.current.mutate({ name: 'hook-ce-01', cpu: 2, memory: 4, disk: 50, os: 'Debian 12', region: 'ANK' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.name).toBe('hook-ce-01')
    expect(result.current.data!.status).toBe('pending')
  })
})

// ---------------------------------------------------------------------------
// useDeleteComputeEngine
// ---------------------------------------------------------------------------

describe('useDeleteComputeEngine()', () => {
  it('deletes Compute Engine successfully', async () => {
    const { result: cr } = renderHook(() => useCreateComputeEngine(), { wrapper: makeWrapper() })
    cr.current.mutate({ name: 'to-del-hook-ce', cpu: 1, memory: 1, disk: 20, os: 'Debian 12', region: 'ANK' })
    await waitFor(() => expect(cr.current.isSuccess).toBe(true))
    const id = cr.current.data!.id

    const { result } = renderHook(() => useDeleteComputeEngine(), { wrapper: makeWrapper() })
    result.current.mutate(id)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('errors for unknown ID', async () => {
    const { result } = renderHook(() => useDeleteComputeEngine(), { wrapper: makeWrapper() })
    result.current.mutate('no-such-ce-del-hook')
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// useUpdateComputeEngine — immutable field rejection
// ---------------------------------------------------------------------------

describe('useUpdateComputeEngine() — immutable field enforcement', () => {
  it('updates mutable status field', async () => {
    const id = getMockComputeEngines()[3].id
    const { result } = renderHook(() => useUpdateComputeEngine(), { wrapper: makeWrapper() })
    result.current.mutate({ id, partial: { status: 'stopped' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.status).toBe('stopped')
  })

  it('updates mutable cpu field', async () => {
    const id = getMockComputeEngines()[4].id
    const { result } = renderHook(() => useUpdateComputeEngine(), { wrapper: makeWrapper() })
    result.current.mutate({ id, partial: { cpu: 16 } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.cpu).toBe(16)
  })

  it('errors when unknown/immutable field is sent (region)', async () => {
    const id = getMockComputeEngines()[0].id
    const { result } = renderHook(() => useUpdateComputeEngine(), { wrapper: makeWrapper() })
    // @ts-expect-error intentionally passing immutable field at runtime
    result.current.mutate({ id, partial: { region: 'IST' } })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('errors for unknown Compute Engine ID', async () => {
    const { result } = renderHook(() => useUpdateComputeEngine(), { wrapper: makeWrapper() })
    result.current.mutate({ id: 'no-such-ce-update', partial: { status: 'stopped' } })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// useComputeEngineMetrics — MetricRange
// ---------------------------------------------------------------------------

describe('useComputeEngineMetrics() — MetricRange', () => {
  const RANGE_POINTS: [string, number][] = [
    ['30m', 30],
    ['1h', 30],
    ['3h', 36],
    ['1w', 42],
  ]

  for (const [range, points] of RANGE_POINTS) {
    it(`range="${range}" resolves with ${points} metric points`, async () => {
      const id = getMockComputeEngines()[0].id
      const { result } = renderHook(
        () => useComputeEngineMetrics(id, range as '30m' | '1h' | '3h' | '1w'),
        { wrapper: makeWrapper() },
      )
      await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 4000 })
      expect(result.current.data!.length).toBe(points)
    })
  }

  it('each metric point has cpu, memory, disk fields', async () => {
    const id = getMockComputeEngines()[0].id
    const { result } = renderHook(() => useComputeEngineMetrics(id, '1h'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 4000 })
    const point = result.current.data![0]
    expect(typeof point.cpu).toBe('number')
    expect(typeof point.memory).toBe('number')
    expect(typeof point.disk).toBe('number')
    expect(typeof point.timestamp).toBe('string')
  })

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(() => useComputeEngineMetrics(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('errors for nonexistent Compute Engine ID', async () => {
    const { result } = renderHook(() => useComputeEngineMetrics('no-such-ce-metrics'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

