import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRegionStore } from '@/store/regionStore'
import { DashboardPage } from '@/pages/DashboardPage'

function renderDashboard(initialRoute = '/services/vm/info') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/services/:serviceId/:tab" element={<DashboardPage />} />
          <Route path="/services/:serviceId" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

import { beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Global Region Filter & Zone Column Integration', () => {
  beforeEach(() => {
    const storageMap = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storageMap.get(key) ?? null,
        setItem: (key: string, value: string) => storageMap.set(key, value),
        removeItem: (key: string) => storageMap.delete(key),
        clear: () => storageMap.clear(),
      },
      writable: true,
      configurable: true,
    })
    useRegionStore.setState({ region: 'ALL' })
  })

  it('updates region in store when selected', () => {
    expect(useRegionStore.getState().region).toBe('ALL')
    useRegionStore.getState().setRegion('ANK')
    expect(useRegionStore.getState().region).toBe('ANK')
    useRegionStore.getState().setRegion('IST')
    expect(useRegionStore.getState().region).toBe('IST')
  })

  it('renders Zone header in the table instead of Region header', async () => {
    renderDashboard('/services/vm/info')
    await waitFor(() => {
      expect(screen.getByText('Zone')).toBeInTheDocument()
    })
    expect(screen.queryByRole('columnheader', { name: /^Region$/i })).not.toBeInTheDocument()
  })

  it('renders region selector dropdown in topbar between search and profile', async () => {
    renderDashboard('/services/vm/info')
    const selectorBtn = screen.getByRole('button', { name: /Region/i })
    expect(selectorBtn).toBeInTheDocument()

    // Open dropdown
    fireEvent.click(selectorBtn)
    expect(screen.getByText('— All Regions —')).toBeInTheDocument()
    expect(screen.getByText('ANK')).toBeInTheDocument()
    expect(screen.getByText('IST')).toBeInTheDocument()
  })

  it('filters table rows when region filter changes', async () => {
    renderDashboard('/services/vm/info')

    // Wait for MSW VMs to load into the table
    await waitFor(() => {
      const zoneCells = screen.queryAllByText(/^(ank|ist)-\d$/i)
      expect(zoneCells.length).toBeGreaterThan(0)
    })

    const selectorBtn = screen.getByRole('button', { name: /Region/i })
    fireEvent.click(selectorBtn)

    // Select ANK region from dropdown
    const ankOption = screen.getByText('ANK')
    fireEvent.click(ankOption)

    expect(useRegionStore.getState().region).toBe('ANK')

    // Verify all visible zone cells start with 'ank-'
    const ankCells = screen.getAllByText(/^ank-\d$/i)
    expect(ankCells.length).toBeGreaterThan(0)
    expect(screen.queryByText(/^ist-\d$/i)).not.toBeInTheDocument()
  })
})
