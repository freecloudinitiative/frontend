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
import { useDatabases, useCreateDatabase } from '@/features/database/hooks'

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

describe('Database — critical list+create flow through MSW', () => {
  it('lists databases, creates a new one, then sees it in a refetched list', async () => {
    const listBefore = renderHook(() => useDatabases(), { wrapper: makeWrapper() })
    await waitFor(() => expect(listBefore.result.current.isSuccess).toBe(true))
    expect(listBefore.result.current.data!.length).toBeGreaterThanOrEqual(9)

    const create = renderHook(() => useCreateDatabase(), { wrapper: makeWrapper() })
    create.result.current.mutate({
      name: 'flow-test-db',
      engine: 'postgres',
      version: '16',
      storageSize: 100,
      cpu: 2,
      memory: 4,
      region: 'ANK',
    })
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true))
    const createdId = create.result.current.data!.id
    expect(create.result.current.data!.name).toBe('flow-test-db')
    expect(create.result.current.data!.engine).toBe('postgres')

    const listAfterCreate = renderHook(() => useDatabases(), { wrapper: makeWrapper() })
    await waitFor(() => expect(listAfterCreate.result.current.isSuccess).toBe(true))
    expect(listAfterCreate.result.current.data!.some((db) => db.id === createdId)).toBe(true)
  })
})
