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
import { resetIamUserStore } from '@/mocks/data/iamUsers'
import { useIamUsers, useCreateIamUser, useIamUserActivity } from '@/features/iam/hooks'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetIamUserStore()
})
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
  it('lists users, creates a new one, then sees it update in the mounted list hook (cache invalidation)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const list = renderHook(() => useIamUsers(), { wrapper })
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true))
    expect(list.result.current.data!.length).toBeGreaterThanOrEqual(9)
    const countBefore = list.result.current.data!.length

    const create = renderHook(() => useCreateIamUser(), { wrapper })
    create.result.current.mutate({
      name: 'Flow Test User',
      email: 'flow-test-user@example.com',
      role: 'editor',
    })
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true))
    const createdId = create.result.current.data!.id
    expect(create.result.current.data!.name).toBe('Flow Test User')
    expect(create.result.current.data!.role).toBe('editor')

    await waitFor(() => expect(list.result.current.data!.length).toBe(countBefore + 1))
    expect(list.result.current.data!.some((u) => u.id === createdId)).toBe(true)
  })
})

describe('useIamUserActivity() — activity log through MSW', () => {
  it('fetches an activity log for an existing user', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const users = renderHook(() => useIamUsers(), { wrapper })
    await waitFor(() => expect(users.result.current.isSuccess).toBe(true))
    const userId = users.result.current.data![0].id

    const { result } = renderHook(() => useIamUserActivity(userId), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.length).toBeGreaterThanOrEqual(5)
    const entry = result.current.data![0]
    expect(typeof entry.timestamp).toBe('string')
    expect(typeof entry.action).toBe('string')
    expect(typeof entry.resource).toBe('string')
    expect(['success', 'failed', 'degraded']).toContain(entry.status)
  })

  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useIamUserActivity(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('errors for a nonexistent user id', async () => {
    const { result } = renderHook(() => useIamUserActivity('no-such-user'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
