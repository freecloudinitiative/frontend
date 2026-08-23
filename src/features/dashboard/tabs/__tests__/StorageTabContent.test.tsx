/**
 * PR #21 — Test Scenarios 2, 3, 4: Objects / Access / Metrics tabs
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { getBuckets } from '@/mocks/data/buckets'
import { StorageTabContent } from '@/features/dashboard/tabs/StorageTabContent'

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

describe('Scenario 2 — Objects tab', () => {
  it('2.3 — no bucket selected shows a select-a-bucket message and no table', () => {
    render(<StorageTabContent tab="objects" selectedBucketId={null} />, { wrapper: makeWrapper() })
    expect(screen.getByText(/\[ NO INSTANCE SELECTED \]/)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('2.1/2.2 — loads and displays file rows for the selected bucket', async () => {
    const bucketId = getBuckets()[0].id
    render(<StorageTabContent tab="objects" selectedBucketId={bucketId} />, { wrapper: makeWrapper() })

    expect(screen.getByText(/Loading objects/i)).toBeTruthy()

    await waitFor(() => expect(screen.queryByText(/Loading objects/i)).toBeNull())
    expect(screen.getByText('Key')).toBeTruthy()
    expect(screen.getByText('Size')).toBeTruthy()
    expect(screen.getByText('Modified')).toBeTruthy()
    expect(screen.getByText('Class')).toBeTruthy()
    // At least one file row rendered with an uppercased storage class
    expect(screen.getAllByText(/STANDARD|NEARLINE|COLDLINE|ARCHIVE/).length).toBeGreaterThan(0)
  })
})

describe('Scenario 3 — Access tab', () => {
  it('3.1 — no bucket selected shows a select-a-bucket message and no table', () => {
    render(<StorageTabContent tab="access" selectedBucketId={null} />, { wrapper: makeWrapper() })
    expect(screen.getByText(/\[ NO INSTANCE SELECTED \]/)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('3.2 — loads and displays access policy rows for the selected bucket', async () => {
    const bucketId = getBuckets()[0].id
    render(<StorageTabContent tab="access" selectedBucketId={bucketId} />, { wrapper: makeWrapper() })

    expect(screen.getByText(/Loading access policies/i)).toBeTruthy()

    await waitFor(() => expect(screen.queryByText(/Loading access policies/i)).toBeNull())
    expect(screen.getByText('Principal')).toBeTruthy()
    expect(screen.getByText('Permission')).toBeTruthy()
    expect(screen.getByText('Resource')).toBeTruthy()
    expect(screen.getByText('Created')).toBeTruthy()
  })

  it('3.3 — shows an error state with retry when the request fails', async () => {
    server.use(
      http.get('*/api/buckets/:id/access-policies', () => HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })),
    )
    const bucketId = getBuckets()[0].id
    render(<StorageTabContent tab="access" selectedBucketId={bucketId} />, { wrapper: makeWrapper() })

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByText(/Failed to load access policies/i)).toBeTruthy()
  })

  it('3.4 — shows an empty state when there are no access policies', async () => {
    server.use(http.get('*/api/buckets/:id/access-policies', () => HttpResponse.json([])))
    const bucketId = getBuckets()[0].id
    render(<StorageTabContent tab="access" selectedBucketId={bucketId} />, { wrapper: makeWrapper() })

    expect(await screen.findByText(/No access policies for this bucket\./i)).toBeTruthy()
  })
})

describe('Scenario 4 — Metrics tab', () => {
  it('4.4 — no bucket selected shows a select-a-bucket message', () => {
    render(<StorageTabContent tab="metrics" selectedBucketId={null} />, { wrapper: makeWrapper() })
    expect(screen.getByText(/\[ NO INSTANCE SELECTED \]/)).toBeTruthy()
  })

  it('4.1/4.2/4.3 — loads metrics, renders progress bar and three chart series', async () => {
    const bucketId = getBuckets()[0].id
    render(<StorageTabContent tab="metrics" selectedBucketId={bucketId} />, { wrapper: makeWrapper() })

    expect(screen.getByText(/Loading metrics/i)).toBeTruthy()

    await waitFor(() => expect(screen.queryByText(/Loading metrics/i)).toBeNull())
    expect(screen.getByText('Size')).toBeTruthy()
    expect(screen.getByText('Read Ops')).toBeTruthy()
    expect(screen.getByText('Write Ops')).toBeTruthy()
    expect(screen.getByText('Object Count')).toBeTruthy()
  })
})
