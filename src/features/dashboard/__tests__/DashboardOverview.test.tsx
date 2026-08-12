import { render, screen, waitFor, within } from '@testing-library/react'
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
      expect(screen.getByText(/\d+ VMs/)).toBeDefined()
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

  it('computes an accurate status breakdown for the VM card from mock data', async () => {
    server.use(
      http.get('*/api/vms', () =>
        HttpResponse.json([
          { id: '1', name: 'vm-a', status: 'running', cpu: 1, memory: 1, disk: 1, diskType: 'SSD', ipAddress: '1.1.1.1', os: 'linux', region: 'ANK', zone: 'ank-1', createdAt: '2024-01-01T00:00:00.000Z' },
          { id: '2', name: 'vm-b', status: 'running', cpu: 1, memory: 1, disk: 1, diskType: 'SSD', ipAddress: '1.1.1.2', os: 'linux', region: 'ANK', zone: 'ank-1', createdAt: '2024-02-01T00:00:00.000Z' },
          { id: '3', name: 'vm-c', status: 'stopped', cpu: 1, memory: 1, disk: 1, diskType: 'SSD', ipAddress: '1.1.1.3', os: 'linux', region: 'ANK', zone: 'ank-1', createdAt: '2024-03-01T00:00:00.000Z' },
        ]),
      ),
    )
    renderOverview()

    await waitFor(() => expect(screen.getByText('3 VMs')).toBeDefined(), { timeout: 4000 })
    expect(screen.getByText('2 Running, 1 Stopped')).toBeDefined()
    expect(screen.getByText(/Last created: vm-c/)).toBeDefined()
  })

  it('shows "no resources" and a zero count when a service has no data', async () => {
    server.use(http.get('*/api/networks', () => HttpResponse.json([])))
    renderOverview()

    await waitFor(() => expect(screen.getByText('0 Networks')).toBeDefined(), { timeout: 4000 })
    expect(screen.getByText('no resources')).toBeDefined()
    expect(screen.getByText('No resources yet')).toBeDefined()
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

  it('renders the hardcoded Recent Activity feed', () => {
    renderOverview()

    const activitySection = screen.getByText('Recent Activity').closest('.fci-box') as HTMLElement
    expect(within(activitySection).getByText(/web-server-03 restarted/)).toBeDefined()
    expect(within(activitySection).getByText(/orders-db backup completed/)).toBeDefined()
  })

  it('renders the hardcoded System Status metrics', () => {
    renderOverview()

    const statusSection = screen.getByText('System Status').closest('.fci-box') as HTMLElement
    expect(within(statusSection).getByText('API Latency')).toBeDefined()
    expect(within(statusSection).getByText('42ms')).toBeDefined()
    expect(within(statusSection).getByText('Uptime')).toBeDefined()
    expect(within(statusSection).getByText('99.98%')).toBeDefined()
    expect(within(statusSection).getByText('Active Alerts')).toBeDefined()
    expect(within(statusSection).getByText('0 active alerts')).toBeDefined()
  })
})
