import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from '@/pages/DashboardPage'
import { useIsCompact, useIsMobile } from '@/hooks/useIsMobile'

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

describe('Intermediate Breakpoint QA (769px – 1450px)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createQueryClient()
    vi.clearAllMocks()
  })

  it('detects intermediate compact viewport (e.g. 1200px) correctly', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      const isCompactQuery = query.includes('1450px')
      const isMobileQuery = query.includes('768px')
      return {
        matches: isCompactQuery && !isMobileQuery,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
    })

    const TestComponent = () => {
      const isMobile = useIsMobile()
      const isCompact = useIsCompact()
      return (
        <div>
          <span data-testid="mobile">{String(isMobile)}</span>
          <span data-testid="compact">{String(isCompact)}</span>
        </div>
      )
    }

    render(<TestComponent />)
    expect(screen.getByTestId('mobile').textContent).toBe('false')
    expect(screen.getByTestId('compact').textContent).toBe('true')
  })

  it('renders Theme controls and Utility links in Profile dropdown when viewport <= 1450px', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1450px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/services/vm/details']}>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Find Profile trigger div
    const profileTrigger = screen.getAllByText('Profile')[0]
    expect(profileTrigger).toBeDefined()

    act(() => {
      fireEvent.click(profileTrigger)
    })

    // Confirm Profile dropdown rendered migrated Theme swatches & Links
    expect(screen.getAllByText('— Theme —')[0]).toBeDefined()
    expect(screen.getAllByText('— Links —')[0]).toBeDefined()

    // Verify external link pills
    expect(screen.getAllByText('About Creator')[0]).toBeDefined()
    expect(screen.getAllByText('Docs')[0]).toBeDefined()
    expect(screen.getAllByText('Grafana')[0]).toBeDefined()
    expect(screen.getAllByText('Prometheus')[0]).toBeDefined()
    expect(screen.getAllByText('Loki')[0]).toBeDefined()
    expect(screen.getAllByText('Chaos Demo')[0]).toBeDefined()
    expect(screen.getAllByText('Architecture')[0]).toBeDefined()
  })

  it('switches theme swatches when clicked inside Profile dropdown', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1450px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/services/vm/details']}>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    const profileTrigger = screen.getAllByText('Profile')[0]
    act(() => {
      fireEvent.click(profileTrigger)
    })

    // Find theme button inside dropdown
    const beigeThemeBtn = screen.getAllByRole('button', { name: 'Beige' })[0]
    expect(beigeThemeBtn).toBeDefined()

    act(() => {
      fireEvent.click(beigeThemeBtn)
    })

    // Check data-theme attribute on document root
    expect(document.documentElement.getAttribute('data-theme')).toBe('beige')
  })
})
