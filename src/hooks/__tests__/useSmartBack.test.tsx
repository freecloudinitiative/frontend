import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useSmartBack } from '@/hooks/useSmartBack'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('useSmartBack hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls navigate(-1) when window.history.state has idx > 0', () => {
    Object.defineProperty(window, 'history', {
      value: { state: { idx: 2 } },
      writable: true,
      configurable: true,
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/dashboard', '/about']}>
        {children}
      </MemoryRouter>
    )

    const { result } = renderHook(() => useSmartBack('/dashboard'), { wrapper })

    act(() => {
      result.current()
    })

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('calls navigate(defaultFallback, { replace: true }) when history state idx is 0', () => {
    Object.defineProperty(window, 'history', {
      value: { state: { idx: 0 } },
      writable: true,
      configurable: true,
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/about']}>
        {children}
      </MemoryRouter>
    )

    const { result } = renderHook(() => useSmartBack('/services/compute-engine/details'), { wrapper })

    act(() => {
      result.current()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/services/compute-engine/details', { replace: true })
  })
})
