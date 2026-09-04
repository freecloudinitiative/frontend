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

describe('DatabaseTabContent — Connections tab', () => {
  it('renders the connections tab with mocked data', async () => {
    const database = getDatabases()[0]
    render(
      <DatabaseTabContent tab="connections" selectedDatabaseId={database.id} maxConnections={200} />,
      { wrapper: makeWrapper() },
    )

    // Wait for the content to load
    await waitFor(() => {
      expect(screen.getByText('Active Connections')).toBeTruthy()
    })

    // Verify section title
    expect(screen.getByText('Active Connections')).toBeTruthy()

    // Verify table headers
    expect(screen.getByText('Client IP')).toBeTruthy()
    expect(screen.getByText('DB')).toBeTruthy()
    expect(screen.getByText('State')).toBeTruthy()
    expect(screen.getByRole('table')).toHaveClass('fci-detail-table')

    // Verify mock data is rendered
    expect(await screen.findByText('10.128.0.5')).toBeTruthy() // clientIp
    expect(await screen.findByText('10.128.0.8')).toBeTruthy() // clientIp
    expect(screen.getAllByText(database.name).length).toBeGreaterThan(0) // database
    expect(await screen.findByText('18m 55s')).toBeTruthy()    // duration

    // Verify the stats calculation
    expect(screen.getByText('Pool Stats')).toBeTruthy()
    expect(screen.getByText((_, el) => el?.textContent === 'Max conn: 200')).toBeTruthy()
    expect(screen.getByText((_, el) => el?.textContent === 'Active: 1')).toBeTruthy()
    expect(screen.getByText((_, el) => el?.textContent === 'Idle: 1')).toBeTruthy()
    expect(screen.getByText((_, el) => el?.textContent === 'Waiting: 1')).toBeTruthy()
  })
})
