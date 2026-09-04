import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { getIamUsers } from '@/mocks/data/iamUsers'
import { DatabaseTabContent } from '../DatabaseTabContent'
import { IamTabContent } from '../IamTabContent'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Log Viewer Theme-Aware Contrast & Readability', () => {
  it('does not present generated database log entries as real data', () => {
    const { container } = render(<DatabaseTabContent tab="logs" selectedDatabaseId="db-1" />)

    expect(container.querySelector('.fci-console-log')).not.toBeInTheDocument()
    expect(screen.getByText('[ DATABASE LOGS UNAVAILABLE ]')).toBeInTheDocument()
    expect(screen.getByText(/no sample or generated log entries are shown/i)).toBeInTheDocument()
    expect(screen.queryByText(/autovacuum/i)).not.toBeInTheDocument()
  })

  it('renders Recent Activity log entries with semantic theme-aware fci-log CSS classes in IamTabContent', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    // Get the first real user from mock data
    const users = getIamUsers()
    const mockUser = {
      ...users[0],
      policies: [],
    }

    const { container } = render(<IamTabContent tab="activity" iamUserWithPolicies={mockUser} />, { wrapper })

    await waitFor(() => {
      const logContainer = container.querySelector('.fci-console-log')
      expect(logContainer).toBeInTheDocument()
    })

    const infoBadges = container.querySelectorAll('.fci-log-info')
    expect(infoBadges.length).toBeGreaterThan(0)

    const timestamps = container.querySelectorAll('.fci-log-timestamp')
    expect(timestamps.length).toBeGreaterThan(0)

    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
  })
})
