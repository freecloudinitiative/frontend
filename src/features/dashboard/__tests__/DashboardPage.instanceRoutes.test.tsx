import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '@/pages/DashboardPage'

const database = {
  id: 'db-1',
  name: 'orders-db',
  engine: 'postgres' as const,
  version: '17',
  status: 'running' as const,
  cpu: 1,
  memory: 1024,
  storageSize: 20,
  connectionString: 'postgresql://example',
  host: 'db.internal',
  port: 5432,
  maxConnections: 100,
  activeConnections: 0,
  backupStatus: 'healthy' as const,
  region: 'IST' as const,
  zone: 'ist-1',
  createdAt: '2026-01-01T00:00:00Z',
}

const emptyQuery = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}
const databaseQuery = { ...emptyQuery, data: [database] }

vi.mock('@/features/computeEngine/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useComputeEngines: () => emptyQuery,
}))
vi.mock('@/features/database/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useDatabases: () => databaseQuery,
}))
vi.mock('@/features/iam/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useIamUsers: () => emptyQuery,
  useIamUser: () => ({ ...emptyQuery, data: null }),
}))
vi.mock('@/features/storage/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useBuckets: () => emptyQuery,
}))
vi.mock('@/features/network/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useNetworks: () => emptyQuery,
}))

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

function renderDashboard(initialRoute: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <LocationProbe />
        <Routes>
          <Route path="/services/:serviceId/:tab" element={<DashboardPage />} />
          <Route path="/services/:serviceId/:resourceId/:tab" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage instance-scoped routes', () => {
  it('hydrates the selected row from a direct resource URL', async () => {
    const { container } = renderDashboard('/services/database/db-1/details')

    await waitFor(() => {
      expect(container.querySelector('.fci-itemslist tbody tr')).toHaveStyle({
        background: 'var(--dash-row-selected-bg)',
      })
    })
  })

  it('keeps the selected resource id when switching tabs', async () => {
    renderDashboard('/services/database/db-1/details')

    fireEvent.click(await screen.findByRole('tab', { name: 'Connections' }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/services/database/db-1/connections')
    })
  })

  it('navigates a service-level row selection to that resource details URL', async () => {
    renderDashboard('/services/database/info')

    fireEvent.click((await screen.findByText('orders-db')).closest('tr') as HTMLTableRowElement)

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/services/database/db-1/details')
    })
  })

  it('redirects an instance tab without a resource id to service info', async () => {
    renderDashboard('/services/database/connections')

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/services/database/info')
    })
  })

  it('removes a resource id from service-level info routes', async () => {
    renderDashboard('/services/database/db-1/info')

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/services/database/info')
    })
  })

  it('opens the SQL editor for the selected database in a new instance-scoped tab', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderDashboard('/services/database/db-1/sql-editor')

    fireEvent.click(await screen.findByRole('button', { name: 'Open in new tab' }))

    expect(openSpy).toHaveBeenCalledWith(
      '/services/database/db-1/sql-editor',
      '_blank',
      'noopener,noreferrer',
    )
    openSpy.mockRestore()
  })
})
