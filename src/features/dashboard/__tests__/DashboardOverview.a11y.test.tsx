/**
 * DashboardOverview — automated axe-core accessibility tests (PR #37)
 *
 * Renders the overview page with MSW-backed data and asserts zero
 * critical/serious axe violations once the live data has loaded.
 */
import { render, waitFor, screen } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { axe } from 'vitest-axe'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/test/server'
import { DashboardOverview } from '@/features/dashboard/DashboardOverview'

function renderOverview() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/services/:serviceId/:tab" element={<div>stub</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('DashboardOverview — axe a11y audit', () => {
  it('has zero critical/serious axe violations once data loads', async () => {
    const { container } = renderOverview()

    // Wait for at least one card to finish loading
    await waitFor(() => {
      expect(screen.getByText(/\d+ VMs/)).toBeDefined()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
