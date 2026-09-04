import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRegionStore } from '@/store/regionStore'
import { DashboardPage } from '@/pages/DashboardPage'
import { server } from '@/test/server'

const queryClients = new Set<QueryClient>()
const pendingRequests = new Set<string>()

function renderDashboard(initialRoute = '/services/compute-engine/info') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  queryClients.add(queryClient)
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

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
  server.events.on('request:start', ({ requestId }) => pendingRequests.add(requestId))
  server.events.on('request:end', ({ requestId }) => pendingRequests.delete(requestId))
})
afterEach(async () => {
  await Promise.all(Array.from(queryClients, (queryClient) => queryClient.cancelQueries()))
  queryClients.forEach((queryClient) => queryClient.clear())
  queryClients.clear()
  server.resetHandlers()
})
afterAll(async () => {
  // Drain pending MSW handlers before jsdom tears down.
  //
  // An already-queued XHR handler promise might still be inside its
  // 300-600ms artificial delay when the last test finishes. Its respondWith()
  // callback will eventually call createEvent(), which needs ProgressEvent
  // on globalThis.
  //
  // Yielding to the event loop is not enough if the delay hasn't settled.
  // We must explicitly wait for all tracked pending requests to end before
  // calling server.close() (which stops intercepting and prevents request:end
  // events) and allowing Vitest to tear down the environment.
  if (pendingRequests.size > 0) {
    await new Promise<void>((resolve) => {
      const check = () => {
        if (pendingRequests.size === 0) resolve()
        else setTimeout(check, 50)
      }
      check()
    })
  }
  
  server.close()
})

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
    useRegionStore.setState({ region: 'IST' })
  })

  it('updates region in store when selected', () => {
    expect(useRegionStore.getState().region).toBe('IST')
    useRegionStore.getState().setRegion('ANK')
    expect(useRegionStore.getState().region).toBe('ANK')
  })

  it('normalizes the removed persisted ALL region to IST', () => {
    const merge = useRegionStore.persist.getOptions().merge
    const hydratedState = merge?.({ region: 'ALL' }, useRegionStore.getState())

    expect(hydratedState?.region).toBe('IST')
  })

  it('Compute Engine table has no Zone or Region column (PR #31 header set)', async () => {
    renderDashboard('/services/compute-engine/info')
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

  it('renders region selector dropdown with IST and disabled ANK only', async () => {
    renderDashboard('/services/compute-engine/info')
    const selectorBtn = screen.getByRole('button', { name: /Region/i })
    expect(selectorBtn).toBeInTheDocument()

    // Open dropdown
    fireEvent.click(selectorBtn)
    expect(screen.queryByText('All', { selector: '.fci-dd-item' })).not.toBeInTheDocument()
    expect(screen.getByText('IST', { selector: '.fci-dd-item' })).toBeInTheDocument()

    const ankOption = screen.getByText('ANK', { selector: '.fci-dd-item' })
    expect(ankOption).toBeInTheDocument()
    expect(ankOption.className).toContain('fci-dd-item-disabled')

    // Clicking disabled ANK option does not change state
    fireEvent.click(ankOption)
    expect(useRegionStore.getState().region).toBe('IST')
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
    const istOption = screen.getByRole('option', { name: 'IST' })
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
