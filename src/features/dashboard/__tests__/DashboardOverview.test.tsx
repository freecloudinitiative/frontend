import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { DashboardOverview } from '@/features/dashboard/DashboardOverview'

function ServicePageStub() {
  const location = useLocation()
  return <div>SERVICE PAGE: {location.pathname}</div>
}

function renderOverview(initialRoute = '/dashboard') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/services/:serviceId/:tab" element={<ServicePageStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('DashboardOverview — PR #30 cross-service summary', () => {
  it('renders all 5 service cards with live resource counts once data loads', async () => {
    renderOverview()

    await waitFor(() => {
      expect(screen.getByText(/\d+ Compute Engines/)).toBeDefined()
      expect(screen.getByText(/\d+ Databases/)).toBeDefined()
      expect(screen.getByText(/\d+ Users/)).toBeDefined()
      expect(screen.getByText(/\d+ Buckets/)).toBeDefined()
      expect(screen.getByText(/\d+ Networks/)).toBeDefined()
    }, { timeout: 4000 })
  })

  it('shows a loading indicator per card before data resolves', () => {
    renderOverview()
    expect(screen.getAllByText('[ LOADING... ]').length).toBeGreaterThan(0)
  })

  it('computes an accurate status breakdown for the Compute Engine card from mock data', async () => {
    server.use(
      http.get('*/api/compute-engines', () =>
        HttpResponse.json([
          { id: '1', name: 'ce-a', status: 'running', cpu: 1, memory: 1, disk: 1, diskType: 'SSD', ipAddress: '1.1.1.1', os: 'linux', region: 'ANK', zone: 'ank-1', createdAt: '2024-01-01T00:00:00.000Z' },
          { id: '2', name: 'ce-b', status: 'running', cpu: 1, memory: 1, disk: 1, diskType: 'SSD', ipAddress: '1.1.1.2', os: 'linux', region: 'ANK', zone: 'ank-1', createdAt: '2024-02-01T00:00:00.000Z' },
          { id: '3', name: 'ce-c', status: 'stopped', cpu: 1, memory: 1, disk: 1, diskType: 'SSD', ipAddress: '1.1.1.3', os: 'linux', region: 'ANK', zone: 'ank-1', createdAt: '2024-03-01T00:00:00.000Z' },
        ]),
      ),
    )
    renderOverview()

    await waitFor(() => expect(screen.getByText('3 Compute Engines')).toBeDefined(), { timeout: 4000 })
    expect(screen.getByText('2 Running, 1 Stopped')).toBeDefined()
    expect(screen.getByText(/Last created: ce-c/)).toBeDefined()
  })

  it('shows "no resources" and a zero count when a service has no data', async () => {
    server.use(http.get('*/api/networks', () => HttpResponse.json([])))
    renderOverview()

    expect(screen.getAllByText('no resources').length).toBeGreaterThan(0)
    expect(screen.getAllByText('No resources yet').length).toBeGreaterThan(0)
  })

  it('navigates to the matching service info tab when a card is clicked', async () => {
    const user = userEvent.setup()
    renderOverview()

    await waitFor(() => expect(screen.getByText(/\d+ Databases/)).toBeDefined(), { timeout: 4000 })

    const databaseCard = screen.getByText('Database').closest('button')
    expect(databaseCard).not.toBeNull()
    await user.click(databaseCard as HTMLButtonElement)

    expect(await screen.findByText('SERVICE PAGE: /services/database/info')).toBeDefined()
  })
})
