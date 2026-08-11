/**
 * PR #21 — Test Scenarios 2, 3, 4: Objects / Access / Metrics tabs
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
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
    expect(screen.getByText(/Select a bucket to view objects/)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('2.1/2.2 — loads and displays file rows for the selected bucket', async () => {
    const bucketId = getBuckets()[0].id
    render(<StorageTabContent tab="objects" selectedBucketId={bucketId} />, { wrapper: makeWrapper() })

    expect(screen.getByText(/Loading objects/)).toBeTruthy()

    await waitFor(() => expect(screen.queryByText(/Loading objects/)).toBeNull())
    expect(screen.getByText('Key')).toBeTruthy()
    expect(screen.getByText('Size')).toBeTruthy()
    expect(screen.getByText('Modified')).toBeTruthy()
    expect(screen.getByText('Class')).toBeTruthy()
    // At least one file row rendered with an uppercased storage class
    expect(screen.getAllByText(/STANDARD|NEARLINE|COLDLINE|ARCHIVE/).length).toBeGreaterThan(0)
  })
})

describe('Scenario 3 — Access tab', () => {
  it('3.1 — renders hardcoded IAM bindings without any network call', () => {
    render(<StorageTabContent tab="access" selectedBucketId={null} />, { wrapper: makeWrapper() })
    expect(screen.getByText('IAM Bindings')).toBeTruthy()
    expect(screen.getByText('allUsers')).toBeTruthy()
  })
})

describe('Scenario 4 — Metrics tab', () => {
  it('4.4 — no bucket selected shows a select-a-bucket message', () => {
    render(<StorageTabContent tab="metrics" selectedBucketId={null} />, { wrapper: makeWrapper() })
    expect(screen.getByText(/Select a bucket to view metrics/)).toBeTruthy()
  })

  it('4.1/4.2/4.3 — loads metrics, renders progress bar and three chart series', async () => {
    const bucketId = getBuckets()[0].id
    render(<StorageTabContent tab="metrics" selectedBucketId={bucketId} />, { wrapper: makeWrapper() })

    expect(screen.getByText(/Loading metrics/)).toBeTruthy()

    await waitFor(() => expect(screen.queryByText(/Loading metrics/)).toBeNull())
    expect(screen.getByText('Size')).toBeTruthy()
    expect(screen.getByText('Read Ops')).toBeTruthy()
    expect(screen.getByText('Write Ops')).toBeTruthy()
    expect(screen.getByText('Object Count')).toBeTruthy()
  })
})
