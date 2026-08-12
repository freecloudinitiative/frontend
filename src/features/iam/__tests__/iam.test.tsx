/**
 * PR #34 — critical-flow integration test for the IAM service.
 * Exercises the real hooks against the real MSW handlers end-to-end
 * (list -> create -> appears in list), rather than testing each hook in
 * isolation (see hooks.test.tsx for that).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { useIamUsers, useCreateIamUser } from '@/features/iam/hooks'

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

describe('IAM — critical list+create flow through MSW', () => {
  it('lists users, creates a new one, then sees it in a refetched list', async () => {
    const listBefore = renderHook(() => useIamUsers(), { wrapper: makeWrapper() })
    await waitFor(() => expect(listBefore.result.current.isSuccess).toBe(true))
    expect(listBefore.result.current.data!.length).toBeGreaterThanOrEqual(9)

    const create = renderHook(() => useCreateIamUser(), { wrapper: makeWrapper() })
    create.result.current.mutate({
      name: 'Flow Test User',
      email: 'flow-test-user@example.com',
      role: 'editor',
    })
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true))
    const createdId = create.result.current.data!.id
    expect(create.result.current.data!.name).toBe('Flow Test User')
    expect(create.result.current.data!.role).toBe('editor')

    const listAfterCreate = renderHook(() => useIamUsers(), { wrapper: makeWrapper() })
    await waitFor(() => expect(listAfterCreate.result.current.isSuccess).toBe(true))
    expect(listAfterCreate.result.current.data!.some((u) => u.id === createdId)).toBe(true)
  })
})
