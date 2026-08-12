import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRegionStore } from '@/store/regionStore'
import { DashboardPage } from '@/pages/DashboardPage'
import { server } from '@/test/server'

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

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Global Region Filter & Table Region Column Integration', () => {
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
    useRegionStore.getState().setRegion('IST')
    expect(useRegionStore.getState().region).toBe('IST')
  })

  it('VM table has no Zone or Region column (PR #31 header set)', async () => {
    renderDashboard('/services/vm/info')
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /^Name$/i })).toBeInTheDocument()
    })
    expect(screen.queryByRole('columnheader', { name: /^Zone$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /^Region$/i })).not.toBeInTheDocument()
  })

  it('IAM table shows a Region column', async () => {
    renderDashboard('/services/iam/info')
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /^Region$/i })).toBeInTheDocument()
    })
  })

  it('renders region selector dropdown with options All, IST, ANK (disabled)', async () => {
    renderDashboard('/services/vm/info')
    const selectorBtn = screen.getByRole('button', { name: /Region/i })
    expect(selectorBtn).toBeInTheDocument()

    // Open dropdown
    fireEvent.click(selectorBtn)
    expect(screen.getByText('All', { selector: '.fci-dd-item' })).toBeInTheDocument()
    expect(screen.getByText('IST', { selector: '.fci-dd-item' })).toBeInTheDocument()

    const ankOption = screen.getByText('ANK', { selector: '.fci-dd-item' })
    expect(ankOption).toBeInTheDocument()
    expect(ankOption.className).toContain('fci-dd-item-disabled')

    // Clicking disabled ANK option does not change state
    fireEvent.click(ankOption)
    expect(useRegionStore.getState().region).toBe('ALL')
  })

  it('filters table rows to show only IST instances when IST is selected', async () => {
    const { container } = renderDashboard('/services/iam/info')

    // Wait for MSW IAM users to load into the table
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /^Region$/i })).toBeInTheDocument()
    })

    // Use the dedicated region-selector element (id-scoped) — the IAM table also
    // has its own "Region" column-header button, so a name-only query is ambiguous.
    const selectorBtn = container.querySelector('#btn-region-selector') as HTMLElement
    expect(selectorBtn).toBeInTheDocument()
    fireEvent.click(selectorBtn)

    // Select IST region from dropdown
    const istOption = screen.getByText('IST')
    fireEvent.click(istOption)

    expect(useRegionStore.getState().region).toBe('IST')

    // Every visible Region cell within the table should now read 'IST'
    const table = within(container.querySelector('.fci-itemslist') as HTMLElement)
    await waitFor(() => {
      const regionCells = table.getAllByText(/^IST$/)
      expect(regionCells.length).toBeGreaterThan(0)
    })
    expect(table.queryByText(/^ANK$/)).not.toBeInTheDocument()
  })
})
