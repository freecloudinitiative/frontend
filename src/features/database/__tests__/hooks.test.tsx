/**
 * PR #15 — Database service: React Query hooks integration tests
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { getDatabases as getMockDatabases } from '@/mocks/data/databases'
import {
  useDatabases,
  useDatabase,
  useCreateDatabase,
  useDeleteDatabase,
  useUpdateDatabase,
  useDatabaseMetrics,
  useExecuteSql,
  databaseKeys,
} from '@/features/database/hooks'

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
// Query key spec
// ---------------------------------------------------------------------------

describe('Database query key constants', () => {
  it('databaseKeys.all is ["databases"]', () => {
    expect(databaseKeys.all).toEqual(['databases'])
  })

  it('databaseKeys.detail(id) is ["databases", id]', () => {
    expect(databaseKeys.detail('abc')).toEqual(['databases', 'abc'])
  })

  it('databaseKeys.metrics(id) is ["databases", id, "metrics"]', () => {
    expect(databaseKeys.metrics('abc')).toEqual(['databases', 'abc', 'metrics'])
  })
})

// ---------------------------------------------------------------------------
// useDatabases
// ---------------------------------------------------------------------------

describe('useDatabases()', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useDatabases(), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('resolves with 8+ databases', async () => {
    const { result } = renderHook(() => useDatabases(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.length).toBeGreaterThanOrEqual(8)
  })

  it('returned databases have engine and status fields', async () => {
    const { result } = renderHook(() => useDatabases(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const db = result.current.data![0]
    expect(['postgres', 'mysql', 'redis']).toContain(db.engine)
    expect(['running', 'stopped', 'pending']).toContain(db.status)
  })
})

// ---------------------------------------------------------------------------
// useDatabase
// ---------------------------------------------------------------------------

describe('useDatabase(id)', () => {
  it('fetches single database by ID', async () => {
    const id = getMockDatabases()[0].id
    const { result } = renderHook(() => useDatabase(id), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.id).toBe(id)
  })

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(() => useDatabase(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('enters error state for nonexistent ID', async () => {
    const { result } = renderHook(() => useDatabase('no-such-db-hook'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// useCreateDatabase
// ---------------------------------------------------------------------------

describe('useCreateDatabase()', () => {
  it('creates a database and returns it in pending status', async () => {
    const { result } = renderHook(() => useCreateDatabase(), { wrapper: makeWrapper() })
    result.current.mutate({
      name: 'hook-test-db',
      engine: 'postgres',
      version: '16.1',
      storageSize: 50,
      cpu: 2,
      memory: 4,
      region: 'ANK',
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.name).toBe('hook-test-db')
    expect(result.current.data!.status).toBe('pending')
  })

  it('isPending transitions to false after success', async () => {
    const { result } = renderHook(() => useCreateDatabase(), { wrapper: makeWrapper() })
    result.current.mutate({ name: 'pending-db', engine: 'mysql', version: '8.0', storageSize: 20, cpu: 1, memory: 1, region: 'IST' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isPending).toBe(false)
  })

  it('enters error state for invalid engine', async () => {
    const { result } = renderHook(() => useCreateDatabase(), { wrapper: makeWrapper() })
    // @ts-expect-error intentional invalid engine
    result.current.mutate({ engine: 'oracle' })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// useDeleteDatabase
// ---------------------------------------------------------------------------

describe('useDeleteDatabase()', () => {
  it('deletes a database by ID', async () => {
    // Create one first
    const { result: createResult } = renderHook(() => useCreateDatabase(), { wrapper: makeWrapper() })
    createResult.current.mutate({ name: 'to-del-hook', engine: 'redis', version: '7.2', storageSize: 20, cpu: 1, memory: 1, region: 'ANK' })
    await waitFor(() => expect(createResult.current.isSuccess).toBe(true))
    const id = createResult.current.data!.id

    const { result } = renderHook(() => useDeleteDatabase(), { wrapper: makeWrapper() })
    result.current.mutate(id)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('enters error state for unknown ID', async () => {
    const { result } = renderHook(() => useDeleteDatabase(), { wrapper: makeWrapper() })
    result.current.mutate('no-such-db-del-hook')
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// useUpdateDatabase
// ---------------------------------------------------------------------------

describe('useUpdateDatabase()', () => {
  it('updates database status', async () => {
    const id = getMockDatabases()[3].id
    const { result } = renderHook(() => useUpdateDatabase(), { wrapper: makeWrapper() })
    result.current.mutate({ id, partial: { status: 'stopped' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.status).toBe('stopped')
  })

  it('updates cpu', async () => {
    const id = getMockDatabases()[4].id
    const { result } = renderHook(() => useUpdateDatabase(), { wrapper: makeWrapper() })
    result.current.mutate({ id, partial: { cpu: 8 } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.cpu).toBe(8)
  })

  it('enters error state for unknown ID', async () => {
    const { result } = renderHook(() => useUpdateDatabase(), { wrapper: makeWrapper() })
    result.current.mutate({ id: 'no-such-update-db', partial: { status: 'stopped' } })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// useDatabaseMetrics
// ---------------------------------------------------------------------------

describe('useDatabaseMetrics(id)', () => {
  it('fetches 24-point metric series', async () => {
    const id = getMockDatabases()[0].id
    const { result } = renderHook(() => useDatabaseMetrics(id), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.length).toBe(24)
    expect(typeof result.current.data![0].cpuUsage).toBe('number')
  })

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(() => useDatabaseMetrics(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// useExecuteSql
// ---------------------------------------------------------------------------

describe('useExecuteSql()', () => {
  it('executes SELECT and returns resultData', async () => {
    const id = getMockDatabases()[0].id
    const { result } = renderHook(() => useExecuteSql(), { wrapper: makeWrapper() })
    result.current.mutate({ databaseId: id, script: 'SELECT * FROM users' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.success).toBe(true)
    expect(Array.isArray(result.current.data!.resultData)).toBe(true)
  })

  it('enters error state for DROP statement', async () => {
    const id = getMockDatabases()[0].id
    const { result } = renderHook(() => useExecuteSql(), { wrapper: makeWrapper() })
    result.current.mutate({ databaseId: id, script: 'DROP TABLE users' })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
