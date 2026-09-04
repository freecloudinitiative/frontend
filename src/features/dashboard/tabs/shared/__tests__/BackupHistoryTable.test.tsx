import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { getDatabases } from '@/mocks/data/databases'
import { server } from '@/test/server'
import { BackupHistoryTable } from '../BackupHistoryTable'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('BackupHistoryTable', () => {
  it('does not request or invent history before a database is selected', () => {
    render(<BackupHistoryTable selectedDatabaseId={null} />, { wrapper: makeWrapper() })

    expect(screen.getByText('[ NO DATABASE SELECTED ]')).toBeInTheDocument()
    expect(screen.queryByText('bkp-001')).not.toBeInTheDocument()
  })

  it('shows loading followed by the backend empty/disabled state', async () => {
    const databaseId = getDatabases()[0].id
    render(<BackupHistoryTable selectedDatabaseId={databaseId} />, { wrapper: makeWrapper() })

    expect(screen.getByText('[ LOADING BACKUPS... ]')).toBeInTheDocument()
    expect(await screen.findByText('No backups exist for this database.')).toBeInTheDocument()
    expect(screen.getByText('Disabled')).toBeInTheDocument()
  })

  it('renders history and policy values returned by database-service', async () => {
    const databaseId = getDatabases()[0].id
    server.use(
      http.get('*/api/databases/:id/backups', () => HttpResponse.json({
        backups: [
          {
            id: 'dynamic-backup-id',
            status: 'completed',
            startedAt: '2026-09-04T02:00:00Z',
            completedAt: '2026-09-04T02:05:00Z',
            sizeBytes: 1024,
            encryption: 'AES256',
          },
        ],
        policy: { enabled: true, schedule: '0 3 * * *', retentionDays: 14, encryption: 'AES256' },
      })),
    )

    render(<BackupHistoryTable selectedDatabaseId={databaseId} />, { wrapper: makeWrapper() })

    expect(await screen.findByText('dynamic-backup-id')).toBeInTheDocument()
    expect(screen.getByText('1.0 KB')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('0 3 * * * (UTC)')).toBeInTheDocument()
    expect(screen.getByText('14 days')).toBeInTheDocument()
    expect(screen.getAllByText('AES256')).toHaveLength(1)
    expect(screen.queryByText('bkp-001')).not.toBeInTheDocument()
  })

  it('shows unavailable values instead of fabricated size or encryption data', async () => {
    const databaseId = getDatabases()[0].id
    server.use(
      http.get('*/api/databases/:id/backups', () => HttpResponse.json({
        backups: [{ id: 'backup-with-limited-status', status: 'running' }],
        policy: { enabled: true, schedule: '0 3 * * *', retentionDays: 7 },
      })),
    )

    render(<BackupHistoryTable selectedDatabaseId={databaseId} />, { wrapper: makeWrapper() })

    expect(await screen.findByText('backup-with-limited-status')).toBeInTheDocument()
    expect(screen.getAllByText('Not reported').length).toBeGreaterThanOrEqual(3)
  })
})
