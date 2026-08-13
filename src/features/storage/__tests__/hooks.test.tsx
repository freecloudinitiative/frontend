/**
 * Scenario 5 — React Query Hooks Integration Tests
 * Tests all 6 storage React Query hooks inside a QueryClientProvider
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { getBuckets as getMockBuckets, resetBucketStore } from '@/mocks/data/buckets'
import {
  useBuckets,
  useBucket,
  useCreateBucket,
  useDeleteBucket,
  useBucketFiles,
  useBucketMetrics,
  storageKeys,
} from '@/features/storage/hooks'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetBucketStore()
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

describe('Storage Query Key Constants', () => {
  it('storageKeys factory produces correct keys', () => {
    expect(storageKeys.all).toEqual(['buckets'])
    expect(storageKeys.detail('b-1')).toEqual(['buckets', 'b-1'])
    expect(storageKeys.files('b-1')).toEqual(['buckets', 'b-1', 'files'])
    expect(storageKeys.metrics('b-1')).toEqual(['buckets', 'b-1', 'metrics'])
  })
})

describe('Scenario 5.1 — useBuckets()', () => {
  it('starts with loading state and resolves to data state with buckets list', async () => {
    const { result } = renderHook(() => useBuckets(), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isLoading).toBe(false)
    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data!.length).toBeGreaterThanOrEqual(6)
  })
})

describe('Scenario 5.2 — useBucket(id)', () => {
  it('fetches single bucket data by ID', async () => {
    const targetId = getMockBuckets()[0].id
    const { result } = renderHook(() => useBucket(targetId), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.id).toBe(targetId)
    expect(typeof result.current.data!.bucketName).toBe('string')
  })

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(() => useBucket(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('enters error state for non-existent bucket ID', async () => {
    const { result } = renderHook(() => useBucket('non-existent-hook-bucket-id'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})

describe('Scenario 5.3 — useCreateBucket()', () => {
  it('mutation creates a bucket and resolves with created Bucket object', async () => {
    const { result } = renderHook(() => useCreateBucket(), { wrapper: makeWrapper() })
    result.current.mutate({ bucketName: 'hook-create-bucket', region: 'ANK', access: 'private' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.bucketName).toBe('hook-create-bucket')
    expect(result.current.data!.region).toBe('ANK')
    expect(result.current.data!.access).toBe('private')
  })

  it('mutation enters error state for invalid input', async () => {
    const { result } = renderHook(() => useCreateBucket(), { wrapper: makeWrapper() })
    result.current.mutate({ bucketName: 'Bad Name Spaced', region: 'ANK', access: 'private' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeNull()
  })
})

describe('Scenario 5.4 — useDeleteBucket()', () => {
  it('mutation deletes bucket by ID', async () => {
    const { result: createRes } = renderHook(() => useCreateBucket(), { wrapper: makeWrapper() })
    createRes.current.mutate({ bucketName: 'hook-del-bucket', region: 'IST', access: 'public-read' })

    await waitFor(() => expect(createRes.current.isSuccess).toBe(true))
    const idToDelete = createRes.current.data!.id

    const { result: deleteRes } = renderHook(() => useDeleteBucket(), { wrapper: makeWrapper() })
    deleteRes.current.mutate(idToDelete)

    await waitFor(() => expect(deleteRes.current.isSuccess).toBe(true))
  })
})

describe('Scenario 5.5 — useBucketFiles(bucketId)', () => {
  it('fetches file list for a bucket', async () => {
    const targetId = getMockBuckets()[0].id
    const { result } = renderHook(() => useBucketFiles(targetId), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data!.length).toBeGreaterThanOrEqual(5)
    expect(result.current.data![0].bucketId).toBe(targetId)
  })

  it('is disabled when bucketId is undefined', () => {
    const { result } = renderHook(() => useBucketFiles(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })
})

describe('Scenario 5.6 — useBucketMetrics(bucketId)', () => {
  it('fetches 24-point metrics array', async () => {
    const targetId = getMockBuckets()[0].id
    const { result } = renderHook(() => useBucketMetrics(targetId), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data!.length).toBe(24)
  })

  it('is disabled when bucketId is undefined', () => {
    const { result } = renderHook(() => useBucketMetrics(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })
})
