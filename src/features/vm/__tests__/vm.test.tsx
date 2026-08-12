/**
 * PR #34 — critical-flow integration test for the VM service.
 * Exercises the real hooks against the real MSW handlers end-to-end
 * (list -> create -> appears in list -> delete -> gone), rather than
 * testing each hook in isolation (see hooks.test.tsx for that).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { getVms } from '@/mocks/data/vms'
import { useVms, useCreateVm, useDeleteVm, useVmMetrics } from '@/features/vm/hooks'

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

describe('VM — critical CRUD flow through MSW', () => {
  it('creates a VM, sees it in the list, then deletes it and sees it gone', async () => {
    const listBefore = renderHook(() => useVms(), { wrapper: makeWrapper() })
    await waitFor(() => expect(listBefore.result.current.isSuccess).toBe(true))
    expect(listBefore.result.current.data!.length).toBeGreaterThanOrEqual(9)

    const create = renderHook(() => useCreateVm(), { wrapper: makeWrapper() })
    create.result.current.mutate({
      name: 'flow-test-vm',
      cpu: 2,
      memory: 4,
      disk: 50,
      os: 'Debian 12',
      region: 'ANK',
    })
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true))
    const createdId = create.result.current.data!.id
    expect(create.result.current.data!.name).toBe('flow-test-vm')
    expect(create.result.current.data!.status).toBe('pending')

    const listAfterCreate = renderHook(() => useVms(), { wrapper: makeWrapper() })
    await waitFor(() => expect(listAfterCreate.result.current.isSuccess).toBe(true))
    expect(listAfterCreate.result.current.data!.some((vm) => vm.id === createdId)).toBe(true)

    const del = renderHook(() => useDeleteVm(), { wrapper: makeWrapper() })
    del.result.current.mutate(createdId)
    await waitFor(() => expect(del.result.current.isSuccess).toBe(true))

    const listAfterDelete = renderHook(() => useVms(), { wrapper: makeWrapper() })
    await waitFor(() => expect(listAfterDelete.result.current.isSuccess).toBe(true))
    expect(listAfterDelete.result.current.data!.some((vm) => vm.id === createdId)).toBe(false)
  })

  it('fetches a 30-point metric series for an existing VM', async () => {
    const id = getVms()[0].id
    const { result } = renderHook(() => useVmMetrics(id, '1h'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.length).toBe(30)
    const point = result.current.data![0]
    expect(typeof point.cpu).toBe('number')
    expect(typeof point.memory).toBe('number')
    expect(typeof point.disk).toBe('number')
    expect(typeof point.timestamp).toBe('string')
  })
})
