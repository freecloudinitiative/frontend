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
    // Mock matchMedia for 1200px (compact: true, mobile: false)
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
    // Mock matchMedia for 1200px (isCompact: true)
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      const isCompactQuery = query.includes('1450px')
      return {
        matches: isCompactQuery,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/services/vm/details']}>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Find and click Profile trigger button
    const profileBtn = screen.getByRole('button', { name: /Profile/i })
    expect(profileBtn).toBeDefined()

    act(() => {
      fireEvent.click(profileBtn)
    })

    // Confirm Profile dropdown rendered migrated Theme swatches & Links
    expect(screen.getByText('— Theme —')).toBeDefined()
    expect(screen.getByText('— Links —')).toBeDefined()

    // Verify external link pills
    expect(screen.getByText('About Creator')).toBeDefined()
    expect(screen.getByText('Docs')).toBeDefined()
    expect(screen.getByText('Grafana')).toBeDefined()
    expect(screen.getByText('Prometheus')).toBeDefined()
    expect(screen.getByText('Loki')).toBeDefined()
    expect(screen.getByText('Chaos Demo')).toBeDefined()
    expect(screen.getByText('Architecture')).toBeDefined()
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

    const profileBtn = screen.getByRole('button', { name: /Profile/i })
    act(() => {
      fireEvent.click(profileBtn)
    })

    // Find theme buttons inside dropdown
    const beigeThemeBtn = screen.getByRole('button', { name: 'Beige' })
    expect(beigeThemeBtn).toBeDefined()

    act(() => {
      fireEvent.click(beigeThemeBtn)
    })

    // Check data-theme attribute on document root
    expect(document.documentElement.getAttribute('data-theme')).toBe('beige')
  })
})
