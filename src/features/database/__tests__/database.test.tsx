/**
 * PR #34 — critical-flow integration test for the Database service.
 * Exercises the real hooks against the real MSW handlers end-to-end
 * (list -> create -> appears in list), rather than testing each hook in
 * isolation (see hooks.test.tsx for that).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { resetDatabaseStore } from '@/mocks/data/databases'
import { useDatabases, useCreateDatabase } from '@/features/database/hooks'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetDatabaseStore()
})
afterAll(() => server.close())

describe('Database — critical list+create flow through MSW', () => {
  it('lists databases, creates a new one, then sees it update in the mounted list hook (cache invalidation)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const list = renderHook(() => useDatabases(), { wrapper })
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true))
    expect(list.result.current.data!.length).toBeGreaterThanOrEqual(9)
    const countBefore = list.result.current.data!.length

    const create = renderHook(() => useCreateDatabase(), { wrapper })
    create.result.current.mutate({
      name: 'flow-test-db',
      engine: 'postgres',
      version: '16',
      storageSize: 100,
      cpu: 2,
      memory: 4096,
      region: 'ANK',
    })
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true))
    const createdId = create.result.current.data!.id
    expect(create.result.current.data!.name).toBe('flow-test-db')
    expect(create.result.current.data!.engine).toBe('postgres')

    await waitFor(() => expect(list.result.current.data!.length).toBe(countBefore + 1))
    expect(list.result.current.data!.some((db) => db.id === createdId)).toBe(true)
  })
})

// Note: useImportData() (multipart file upload) is intentionally not covered
// here. axios's FormData auto-detection doesn't interoperate reliably with
// jsdom's FormData/XHR implementation in this test environment — the request
// body gets flattened before it reaches the network layer regardless of
// header handling, a tooling limitation rather than a product bug (real
// browsers have one spec-compliant FormData/XHR pair). While investigating
// this, we did find and fix a genuine bug: src/features/database/api.ts's
// importData() hardcoded a boundary-less 'multipart/form-data' Content-Type,
// which would have broken real uploads too.
