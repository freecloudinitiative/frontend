/**
 * VM React Query hooks integration tests.
 * useVmMetrics with MetricRange.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { getVms as getMockVms } from '@/mocks/data/vms'
import {
  useVms,
  useVm,
  useCreateVm,
  useDeleteVm,
  useUpdateVm,
  useVmMetrics,
  vmKeys,
} from '@/features/vm/hooks'

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

describe('VM query key constants', () => {
  it('vmKeys.all is ["vms"]', () => {
    expect(vmKeys.all).toEqual(['vms'])
  })

  it('vmKeys.detail(id) is ["vms", id]', () => {
    expect(vmKeys.detail('abc')).toEqual(['vms', 'abc'])
  })

  it('vmKeys.metrics(id, range) is ["vms", id, "metrics", range]', () => {
    expect(vmKeys.metrics('abc', '1h')).toEqual(['vms', 'abc', 'metrics', '1h'])
  })
})

// ---------------------------------------------------------------------------
// useVms
// ---------------------------------------------------------------------------

describe('useVms()', () => {
  it('starts loading then resolves with 9+ VMs', async () => {
    const { result } = renderHook(() => useVms(), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.length).toBeGreaterThanOrEqual(9)
  })

  it('each VM has status and region', async () => {
    const { result } = renderHook(() => useVms(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const vm = result.current.data![0]
    expect(['running', 'stopped', 'pending']).toContain(vm.status)
    expect(['ANK', 'IST']).toContain(vm.region)
  })
})

// ---------------------------------------------------------------------------
// useVm
// ---------------------------------------------------------------------------

describe('useVm(id)', () => {
  it('fetches single VM by ID', async () => {
    const id = getMockVms()[0].id
    const { result } = renderHook(() => useVm(id), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.id).toBe(id)
  })

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(() => useVm(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('enters error state for nonexistent ID', async () => {
    const { result } = renderHook(() => useVm('no-such-vm-hook'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// useCreateVm
// ---------------------------------------------------------------------------

describe('useCreateVm()', () => {
  it('creates VM in pending status', async () => {
    const { result } = renderHook(() => useCreateVm(), { wrapper: makeWrapper() })
    result.current.mutate({ name: 'hook-vm-01', cpu: 2, memory: 4, disk: 50, os: 'Debian 12', region: 'ANK' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.name).toBe('hook-vm-01')
    expect(result.current.data!.status).toBe('pending')
  })
})

// ---------------------------------------------------------------------------
// useDeleteVm
// ---------------------------------------------------------------------------

describe('useDeleteVm()', () => {
  it('deletes VM successfully', async () => {
    const { result: cr } = renderHook(() => useCreateVm(), { wrapper: makeWrapper() })
    cr.current.mutate({ name: 'to-del-hook-vm', cpu: 1, memory: 1, disk: 20, os: 'Debian 12', region: 'ANK' })
    await waitFor(() => expect(cr.current.isSuccess).toBe(true))
    const id = cr.current.data!.id

    const { result } = renderHook(() => useDeleteVm(), { wrapper: makeWrapper() })
    result.current.mutate(id)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('errors for unknown ID', async () => {
    const { result } = renderHook(() => useDeleteVm(), { wrapper: makeWrapper() })
    result.current.mutate('no-such-vm-del-hook')
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// useUpdateVm — immutable field rejection
// ---------------------------------------------------------------------------

describe('useUpdateVm() — immutable field enforcement', () => {
  it('updates mutable status field', async () => {
    const id = getMockVms()[3].id
    const { result } = renderHook(() => useUpdateVm(), { wrapper: makeWrapper() })
    result.current.mutate({ id, partial: { status: 'stopped' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.status).toBe('stopped')
  })

  it('updates mutable cpu field', async () => {
    const id = getMockVms()[4].id
    const { result } = renderHook(() => useUpdateVm(), { wrapper: makeWrapper() })
    result.current.mutate({ id, partial: { cpu: 16 } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.cpu).toBe(16)
  })

  it('errors when unknown/immutable field is sent (region)', async () => {
    const id = getMockVms()[0].id
    const { result } = renderHook(() => useUpdateVm(), { wrapper: makeWrapper() })
    // @ts-expect-error intentionally passing immutable field at runtime
    result.current.mutate({ id, partial: { region: 'IST' } })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('errors for unknown VM ID', async () => {
    const { result } = renderHook(() => useUpdateVm(), { wrapper: makeWrapper() })
    result.current.mutate({ id: 'no-such-vm-update', partial: { status: 'stopped' } })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// useVmMetrics — MetricRange
// ---------------------------------------------------------------------------

describe('useVmMetrics() — MetricRange', () => {
  const RANGE_POINTS: [string, number][] = [
    ['30m', 30],
    ['1h', 30],
    ['3h', 36],
    ['1w', 42],
  ]

  for (const [range, points] of RANGE_POINTS) {
    it(`range="${range}" resolves with ${points} metric points`, async () => {
      const id = getMockVms()[0].id
      const { result } = renderHook(
        () => useVmMetrics(id, range as '30m' | '1h' | '3h' | '1w'),
        { wrapper: makeWrapper() },
      )
      await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 4000 })
      expect(result.current.data!.length).toBe(points)
    })
  }

  it('each metric point has cpu, memory, disk fields', async () => {
    const id = getMockVms()[0].id
    const { result } = renderHook(() => useVmMetrics(id, '1h'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 4000 })
    const point = result.current.data![0]
    expect(typeof point.cpu).toBe('number')
    expect(typeof point.memory).toBe('number')
    expect(typeof point.disk).toBe('number')
    expect(typeof point.timestamp).toBe('string')
  })

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(() => useVmMetrics(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('errors for nonexistent VM ID', async () => {
    const { result } = renderHook(() => useVmMetrics('no-such-vm-metrics'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

