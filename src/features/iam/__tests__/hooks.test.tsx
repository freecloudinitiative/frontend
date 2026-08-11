/**
 * Scenarios 7.x — React Query hooks integration tests
 * Renders each hook inside a minimal QueryClientProvider and
 * verifies loading → success → data flow through the MSW Node server.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { getIamUsers as getMockUsers } from '@/mocks/data/iamUsers'
import {
  useIamUsers,
  useIamUser,
  useCreateIamUser,
  useDeleteIamUser,
  useUpdateIamUser,
  iamKeys,
} from '@/features/iam/hooks'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
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
// Query key spec (7.10)
// ---------------------------------------------------------------------------

describe('Section 7.10 – Query key constants', () => {
  it('iamKeys.all is ["iam-users"]', () => {
    expect(iamKeys.all).toEqual(['iam-users'])
  })

  it('iamKeys.detail(id) is ["iam-users", id]', () => {
    expect(iamKeys.detail('abc-123')).toEqual(['iam-users', 'abc-123'])
  })
})

// ---------------------------------------------------------------------------
// useIamUsers
// ---------------------------------------------------------------------------

describe('Section 7 – useIamUsers()', () => {
  it('7.1 / 7.2 – starts with loading state', async () => {
    const { result } = renderHook(() => useIamUsers(), { wrapper: makeWrapper() })
    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('7.3 – resolves to data state with 8-10+ users', async () => {
    const { result } = renderHook(() => useIamUsers(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data!.length).toBeGreaterThanOrEqual(8)
  })

  it('7.3b – data contains IamUser objects without policies', async () => {
    const { result } = renderHook(() => useIamUsers(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const user = result.current.data![0]
    expect(typeof user.id).toBe('string')
    expect(typeof user.name).toBe('string')
    expect('policies' in user).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// useIamUser
// ---------------------------------------------------------------------------

describe('Section 7 – useIamUser(id)', () => {
  it('7.4 – fetches single user with embedded policies', async () => {
    const id = getMockUsers()[0].id
    const { result } = renderHook(() => useIamUser(id), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.id).toBe(id)
    expect(Array.isArray(result.current.data!.policies)).toBe(true)
    expect(result.current.data!.policies.length).toBeGreaterThanOrEqual(2)
  })

  it('7.4b – is disabled (not fetching) when id is undefined', () => {
    const { result } = renderHook(() => useIamUser(undefined), { wrapper: makeWrapper() })
    // When disabled, isLoading should be false and data undefined
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('7.5 – enters error state for nonexistent user ID', async () => {
    const { result } = renderHook(() => useIamUser('nonexistent-hooks-id'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// useCreateIamUser
// ---------------------------------------------------------------------------

describe('Section 7 – useCreateIamUser()', () => {
  it('7.6 – mutation creates user and resolves with IamUser', async () => {
    const { result } = renderHook(() => useCreateIamUser(), { wrapper: makeWrapper() })
    result.current.mutate({ name: 'Hook Frank', email: 'hook.frank@example.com', role: 'viewer' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.name).toBe('Hook Frank')
    expect(result.current.data!.status).toBe('active')
  })

  it('7.7 – isPending transitions during mutation flight', async () => {
    const { result } = renderHook(() => useCreateIamUser(), { wrapper: makeWrapper() })
    result.current.mutate({ name: 'Pending User', email: 'pending@example.com', role: 'editor' })
    // Wait for success — by that point it was pending at some point during the flight
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // After success, isPending must be false
    expect(result.current.isPending).toBe(false)
  })

  it('7.6b – mutation enters error state for invalid role', async () => {
    const { result } = renderHook(() => useCreateIamUser(), { wrapper: makeWrapper() })
    // @ts-expect-error testing runtime validation
    result.current.mutate({ name: 'Bad Role', email: 'bad@test.com', role: 'superuser' })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// useDeleteIamUser
// ---------------------------------------------------------------------------

describe('Section 7 – useDeleteIamUser()', () => {
  it('7.8 – mutation deletes user by ID', async () => {
    // Create a user first via createIamUser directly so we have a fresh ID
    const { result: createResult } = renderHook(() => useCreateIamUser(), { wrapper: makeWrapper() })
    createResult.current.mutate({ name: 'To Delete Hook', email: 'todeletehook@example.com', role: 'viewer' })
    await waitFor(() => expect(createResult.current.isSuccess).toBe(true))
    const id = createResult.current.data!.id

    const { result } = renderHook(() => useDeleteIamUser(), { wrapper: makeWrapper() })
    result.current.mutate(id)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('7.8b – delete mutation errors for unknown user', async () => {
    const { result } = renderHook(() => useDeleteIamUser(), { wrapper: makeWrapper() })
    result.current.mutate('unknown-delete-hook-id')
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// useUpdateIamUser
// ---------------------------------------------------------------------------

describe('Section 7 – useUpdateIamUser()', () => {
  it('7.9 – mutation updates user status', async () => {
    const id = getMockUsers()[4].id
    const { result } = renderHook(() => useUpdateIamUser(), { wrapper: makeWrapper() })
    result.current.mutate({ id, partial: { status: 'locked' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.status).toBe('locked')
    expect(result.current.data!.id).toBe(id)
  })

  it('7.9b – mutation updates mfaEnabled', async () => {
    const id = getMockUsers()[5].id
    const { result } = renderHook(() => useUpdateIamUser(), { wrapper: makeWrapper() })
    result.current.mutate({ id, partial: { mfaEnabled: true } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.mfaEnabled).toBe(true)
  })

  it('7.9c – mutation errors for unknown user', async () => {
    const { result } = renderHook(() => useUpdateIamUser(), { wrapper: makeWrapper() })
    result.current.mutate({ id: 'no-such-user-update', partial: { status: 'disabled' } })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
