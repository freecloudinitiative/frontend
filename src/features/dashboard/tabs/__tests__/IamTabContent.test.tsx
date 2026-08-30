import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { getIamUsers } from '@/mocks/data/iamUsers'
import { IamTabContent } from '../IamTabContent'
import type { IamActivityEntry } from '@/features/iam/types'

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

const mockActivityData: IamActivityEntry[] = [
  {
    id: 'activity-1',
    timestamp: '2026-08-22T10:30:00Z',
    action: 'CreatePolicy',
    resource: 'iam:policy:prod-access',
    status: 'success',
  },
  {
    id: 'activity-2',
    timestamp: '2026-08-22T09:15:00Z',
    action: 'DeleteUser',
    resource: 'iam:user:old-account',
    status: 'failed',
  },
  {
    id: 'activity-3',
    timestamp: '2026-08-22T08:00:00Z',
    action: 'UpdatePolicy',
    resource: 'iam:policy:viewer-role',
    status: 'success',
  },
  {
    id: 'activity-4',
    timestamp: '2026-08-22T07:45:00Z',
    action: 'UpdateUser',
    resource: 'iam:user:sync-pending',
    status: 'degraded',
  },
]

describe('IamTabContent — Activity tab', () => {
  it('renders fetched activity entries with timestamp, status badge, action, and resource', async () => {
    server.use(
      http.get('*/api/iam/users/:id/activity', () =>
        HttpResponse.json(mockActivityData),
      ),
    )

    const mockUser = {
      ...getIamUsers()[0],
      policies: [],
    }

    render(<IamTabContent tab="activity" iamUserWithPolicies={mockUser} />, { wrapper: makeWrapper() })

    expect(await screen.findByText('Recent Activity')).toBeTruthy()

    const entries = await screen.findAllByText(/CreatePolicy|DeleteUser|UpdatePolicy|UpdateUser/)
    expect(entries).toHaveLength(4)

    const successBadges = screen.getAllByText('Success')
    const failedBadges = screen.getAllByText('Failed')
    const degradedBadge = screen.getByText('Degraded')
    expect(successBadges).toHaveLength(2)
    expect(failedBadges).toHaveLength(1)
    expect(degradedBadge).toHaveClass('fci-log-warn')

    expect(screen.getByText(/CreatePolicy iam:policy:prod-access/)).toBeTruthy()
    expect(screen.getByText(/DeleteUser iam:user:old-account/)).toBeTruthy()
    expect(screen.getByText(/UpdatePolicy iam:policy:viewer-role/)).toBeTruthy()
    expect(screen.getByText(/UpdateUser iam:user:sync-pending/)).toBeTruthy()
  })

  it('shows [ NO INSTANCE SELECTED ] when no user is selected', async () => {
    render(<IamTabContent tab="activity" iamUserWithPolicies={null} />, { wrapper: makeWrapper() })

    expect(await screen.findByText(/\[ NO INSTANCE SELECTED \]/)).toBeTruthy()
  })

  it('renders error state with retry button when activity fetch fails', async () => {
    const mockUser = {
      ...getIamUsers()[0],
      policies: [],
    }

    server.use(
      http.get('*/api/iam/users/:id/activity', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    )

    render(<IamTabContent tab="activity" iamUserWithPolicies={mockUser} />, { wrapper: makeWrapper() })

    const errorMessage = await screen.findByText(/Failed to load activity/)
    const retryButton = screen.getByRole('button', { name: /Retry/ })

    expect(errorMessage).toBeTruthy()
    expect(retryButton).toBeTruthy()
  })

  it('recovers from error state when Retry is clicked', async () => {
    const mockUser = {
      ...getIamUsers()[0],
      policies: [],
    }

    server.use(
      http.get('*/api/iam/users/:id/activity', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    )

    render(<IamTabContent tab="activity" iamUserWithPolicies={mockUser} />, { wrapper: makeWrapper() })

    const retryButton = await screen.findByRole('button', { name: /Retry/ })
    expect(screen.getByText(/Failed to load activity/)).toBeTruthy()

    server.use(
      http.get('*/api/iam/users/:id/activity', () =>
        HttpResponse.json(mockActivityData),
      ),
    )

    retryButton.click()

    expect(await screen.findByText(/CreatePolicy/)).toBeTruthy()
    expect(screen.queryByText(/Failed to load activity/)).toBeNull()
  })

  it('shows empty state when activity list is empty', async () => {
    const mockUser = {
      ...getIamUsers()[0],
      policies: [],
    }

    server.use(
      http.get('*/api/iam/users/:id/activity', () =>
        HttpResponse.json([]),
      ),
    )

    render(<IamTabContent tab="activity" iamUserWithPolicies={mockUser} />, { wrapper: makeWrapper() })

    expect(await screen.findByText('No activity recorded.')).toBeTruthy()
  })

  it('does not render hardcoded fake IPs or usernames', async () => {
    const mockUser = {
      ...getIamUsers()[0],
      policies: [],
    }

    server.use(
      http.get('*/api/iam/users/:id/activity', () =>
        HttpResponse.json(mockActivityData),
      ),
    )

    render(<IamTabContent tab="activity" iamUserWithPolicies={mockUser} />, { wrapper: makeWrapper() })

    await screen.findByText('Recent Activity')

    expect(screen.queryByText('197.12.34.55')).toBeNull()
    expect(screen.queryByText('45.33.10.2')).toBeNull()
    expect(screen.queryByText('ci-bot')).toBeNull()
  })
})
