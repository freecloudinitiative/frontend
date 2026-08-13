import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { getDatabases } from '@/mocks/data/databases'
import { DatabaseTabContent } from '@/features/dashboard/tabs/DatabaseTabContent'

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

describe('DatabaseTabContent — Metrics tab (lazy-loaded DatabaseMetricsTab)', () => {
  it('shows a select-a-database message when no database is selected', async () => {
    render(<DatabaseTabContent tab="metrics" selectedDatabaseId={null} />, { wrapper: makeWrapper() })
    expect(await screen.findByText(/\[ NO INSTANCE SELECTED \]/)).toBeTruthy()
  })

  it('lazy-loads the metrics chunk and renders CPU/Mem/Conn bars plus charts', async () => {
    const databaseId = getDatabases()[0].id
    render(
      <DatabaseTabContent tab="metrics" selectedDatabaseId={databaseId} maxConnections={200} />,
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(screen.getByText('Metrics')).toBeTruthy())
    await waitFor(() => expect(screen.getByText('Connections')).toBeTruthy())
    expect(screen.getByText('Queries/sec')).toBeTruthy()
    expect(screen.getByText('Disk I/O')).toBeTruthy()
  })
})
