/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §1.1-1.8, §7.1
 *
 * Pure-factory unit tests against fake { listFn, getFn, createFn, deleteFn } — fast, no MSW.
 * Each of the 5 services' own hooks.test.tsx additionally exercises createResourceHooks
 * end-to-end against real MSW handlers, so the factory is proven both in isolation (here)
 * and against real wiring (there).
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { createResourceHooks, createResourceKeys } from '@/lib/queryFactory'

interface FakeRecord {
  id: string
  name: string
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { Wrapper, queryClient }
}

function makeFactory(
  overrides?: Partial<Parameters<typeof createResourceHooks<FakeRecord, FakeRecord, { name: string }>>[0]>,
  resourceName = 'fake-resource',
) {
  const records: FakeRecord[] = [{ id: '1', name: 'alpha' }, { id: '2', name: 'beta' }]
  const list = vi.fn(async () => records)
  const get = vi.fn(async (id: string) => records.find((r) => r.id === id)!)
  const create = vi.fn(async (input: { name: string }) => ({ id: '3', name: input.name }))
  const remove = vi.fn(async (_id: string) => {})
  const updateSettings = vi.fn(async (id: string, settings: Record<string, unknown>) => ({
    id,
    name: 'updated',
    ...settings,
  }))

  const keys = createResourceKeys(resourceName)
  const hooks = createResourceHooks<FakeRecord, FakeRecord, { name: string }>({
    keys,
    list,
    get,
    create,
    remove,
    updateSettings,
    ...overrides,
  })

  return { hooks, keys, list, get, create, remove, updateSettings }
}

describe('createResourceHooks', () => {
  describe('useList', () => {
    it('returns all seeded records for the resource', async () => {
      const { hooks } = makeFactory()
      const { result } = renderHook(() => hooks.useList(), { wrapper: makeWrapper().Wrapper })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([{ id: '1', name: 'alpha' }, { id: '2', name: 'beta' }])
    })

    it('is invalidated after a create on the same resource', async () => {
      const { hooks, list } = makeFactory()
      const { Wrapper } = makeWrapper()
      const { result: listResult } = renderHook(() => hooks.useList(), { wrapper: Wrapper })
      await waitFor(() => expect(listResult.current.isSuccess).toBe(true))
      expect(list).toHaveBeenCalledTimes(1)

      const { result: createResult } = renderHook(() => hooks.useCreate(), { wrapper: Wrapper })
      createResult.current.mutate({ name: 'gamma' })
      await waitFor(() => expect(createResult.current.isSuccess).toBe(true))
      // list refetched due to invalidateQueries in useCreate's onSuccess
      await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    })

    it('is invalidated after a delete on the same resource', async () => {
      const { hooks, list } = makeFactory()
      const { Wrapper } = makeWrapper()
      const { result: listResult } = renderHook(() => hooks.useList(), { wrapper: Wrapper })
      await waitFor(() => expect(listResult.current.isSuccess).toBe(true))

      const { result: removeResult } = renderHook(() => hooks.useRemove(), { wrapper: Wrapper })
      removeResult.current.mutate('1')
      await waitFor(() => expect(removeResult.current.isSuccess).toBe(true))
      await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    })

    it('is NOT invalidated by a mutation on a different resource (collision guard)', async () => {
      const { hooks: hooksA, list: listA } = makeFactory(undefined, 'fake-resource-a')
      const { hooks: hooksB } = makeFactory(undefined, 'fake-resource-b')
      const { Wrapper } = makeWrapper()

      const { result: listAResult } = renderHook(() => hooksA.useList(), { wrapper: Wrapper })
      await waitFor(() => expect(listAResult.current.isSuccess).toBe(true))
      expect(listA).toHaveBeenCalledTimes(1)

      const { result: createBResult } = renderHook(() => hooksB.useCreate(), { wrapper: Wrapper })
      createBResult.current.mutate({ name: 'other-resource-record' })
      await waitFor(() => expect(createBResult.current.isSuccess).toBe(true))

      // Resource A's list must not have been refetched by resource B's mutation
      expect(listA).toHaveBeenCalledTimes(1)
    })
  })

  describe('useDetail', () => {
    it('fetches and returns the record for a given id', async () => {
      const { hooks } = makeFactory()
      const { result } = renderHook(() => hooks.useDetail('2'), { wrapper: makeWrapper().Wrapper })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual({ id: '2', name: 'beta' })
    })

    it('does not fire a request when id is undefined (enabled: Boolean(id) guard)', async () => {
      const { hooks, get } = makeFactory()
      const { result } = renderHook(() => hooks.useDetail(undefined), { wrapper: makeWrapper().Wrapper })
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(result.current.fetchStatus).toBe('idle')
      expect(get).not.toHaveBeenCalled()
    })

    it('refetches when id changes', async () => {
      const { hooks, get } = makeFactory()
      const { Wrapper } = makeWrapper()
      const { result, rerender } = renderHook(({ id }: { id: string }) => hooks.useDetail(id), {
        wrapper: Wrapper,
        initialProps: { id: '1' },
      })
      await waitFor(() => expect(result.current.data).toEqual({ id: '1', name: 'alpha' }))
      rerender({ id: '2' })
      await waitFor(() => expect(result.current.data).toEqual({ id: '2', name: 'beta' }))
      expect(get).toHaveBeenCalledWith('1')
      expect(get).toHaveBeenCalledWith('2')
    })
  })

  describe('useCreate', () => {
    it('calls create with the given input and returns the created record', async () => {
      const { hooks, create } = makeFactory()
      const { result } = renderHook(() => hooks.useCreate(), { wrapper: makeWrapper().Wrapper })
      result.current.mutate({ name: 'gamma' })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(create).toHaveBeenCalledWith({ name: 'gamma' })
      expect(result.current.data).toEqual({ id: '3', name: 'gamma' })
    })

    it('does not invalidate / falsely succeed on server error, and surfaces the error to the caller', async () => {
      const create = vi.fn(async () => {
        throw new Error('create failed')
      })
      const { hooks, list } = makeFactory({ create })
      const { Wrapper } = makeWrapper()

      // Mount useList first so we have a real cached query to guard against unwanted invalidation.
      const { result: listResult } = renderHook(() => hooks.useList(), { wrapper: Wrapper })
      await waitFor(() => expect(listResult.current.isSuccess).toBe(true))
      expect(list).toHaveBeenCalledTimes(1)

      const { result } = renderHook(() => hooks.useCreate(), { wrapper: Wrapper })
      result.current.mutate({ name: 'x' })
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBeInstanceOf(Error)
      // A failed mutation must not invalidate (and therefore re-fetch) the list query.
      expect(list).toHaveBeenCalledTimes(1)
    })
  })

  describe('useRemove', () => {
    it('removes the record and invalidates the list query', async () => {
      const { hooks, remove } = makeFactory()
      const { result } = renderHook(() => hooks.useRemove(), { wrapper: makeWrapper().Wrapper })
      result.current.mutate('1')
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(remove).toHaveBeenCalledWith('1')
    })
  })

  describe('useUpdateSettings', () => {
    it('PATCHes settings and invalidates the relevant query key', async () => {
      const { hooks, updateSettings, list } = makeFactory()
      const { Wrapper } = makeWrapper()
      const { result: listResult } = renderHook(() => hooks.useList(), { wrapper: Wrapper })
      await waitFor(() => expect(listResult.current.isSuccess).toBe(true))

      const { result } = renderHook(() => hooks.useUpdateSettings(), { wrapper: Wrapper })
      result.current.mutate({ id: '1', settings: { enabled: true } })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(updateSettings).toHaveBeenCalledWith('1', { enabled: true })
      await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    })

    it('throws a clear error if updateSettings was not configured for the resource', () => {
      const { hooks } = makeFactory({ updateSettings: undefined })
      expect(() => renderHook(() => hooks.useUpdateSettings(), { wrapper: makeWrapper().Wrapper })).toThrow(
        /updateSettings was not configured/,
      )
    })
  })
})

describe('createResourceKeys', () => {
  it('produces an `all` list key and a `detail(id)` key namespaced by resource name', () => {
    const keys = createResourceKeys('compute-engines')
    expect(keys.all).toEqual(['compute-engines'])
    expect(keys.detail('abc123')).toEqual(['compute-engines', 'abc123'])
  })

  it('produces non-colliding keys for every real resource name used across the 5 services', () => {
    const resourceNames = ['compute-engines', 'databases', 'iam-users', 'networks', 'buckets']
    const allKeySets = resourceNames.map((name) => JSON.stringify(createResourceKeys(name).all))
    const detailKeySets = resourceNames.map((name) => JSON.stringify(createResourceKeys(name).detail('same-id')))

    expect(new Set(allKeySets).size).toBe(resourceNames.length)
    expect(new Set(detailKeySets).size).toBe(resourceNames.length)
  })

  it('a detail key for one resource never equals the all-key or detail-key of another resource', () => {
    const a = createResourceKeys('compute-engines')
    const b = createResourceKeys('databases')
    expect(a.detail('1')).not.toEqual(b.detail('1'))
    expect(a.all).not.toEqual(b.all)
  })
})
