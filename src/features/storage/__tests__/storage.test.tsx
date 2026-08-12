/**
 * PR #34 — critical-flow integration test for the Storage service.
 * Exercises the real hooks against the real MSW handlers end-to-end
 * (list buckets -> fetch a bucket's files), rather than testing each hook in
 * isolation (see hooks.test.tsx for that).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { getBuckets } from '@/mocks/data/buckets'
import { useBuckets, useBucketFiles } from '@/features/storage/hooks'

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

describe('Storage — critical list+files flow through MSW', () => {
  it('lists buckets, then fetches files for the first bucket', async () => {
    const listBefore = renderHook(() => useBuckets(), { wrapper: makeWrapper() })
    await waitFor(() => expect(listBefore.result.current.isSuccess).toBe(true))
    expect(listBefore.result.current.data!.length).toBeGreaterThanOrEqual(8)

    const bucketId = getBuckets()[0].id

    const files = renderHook(() => useBucketFiles(bucketId), { wrapper: makeWrapper() })
    await waitFor(() => expect(files.result.current.isSuccess).toBe(true))
    expect(files.result.current.data!.length).toBeGreaterThan(0)
    const file = files.result.current.data![0]
    expect(typeof file.key).toBe('string')
    expect(typeof file.size).toBe('number')
  })
})
