import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboardModals } from '@/features/dashboard/useDashboardModals'
import type { ComputeEngine } from '@/features/computeEngine/types'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

const mockComputeEngine: ComputeEngine = {
  id: 'ce-1',
  name: 'web-1',
  region: 'IST',
  zone: 'ist-1a',
  status: 'running',
  ipAddress: '10.0.0.1',
  cpu: 2,
  memory: 4,
  disk: 50,
  diskType: 'SSD',
  os: 'Ubuntu 22.04',
  instanceType: 'shared',
  autoBackups: false,
  createdAt: '2026-01-01',
}

describe('useDashboardModals hook', () => {
  const defaultParams = {
    activeService: 'Compute Engine' as const,
    selectedRowId: null,
    selectedComputeEngine: null,
    selectedDatabase: null,
    selectedIamUser: null,
    selectedBucket: null,
    selectedNetwork: null,
    navigate: vi.fn(),
    selectTab: vi.fn(),
    clearSelectionAndResetTab: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('triggers noSelectionMsg when opening Compute Engine action without selection', () => {
    const { result } = renderHook(() => useDashboardModals(defaultParams), { wrapper })

    expect(result.current.noSelectionMsg).toBe(false)
    expect(result.current.modalAction).toBeNull()

    act(() => {
      result.current.openComputeEngineAction('stop')
    })

    expect(result.current.noSelectionMsg).toBe(true)
    expect(result.current.modalAction).toBeNull()

    // Timer auto-clears message after 2500ms
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(result.current.noSelectionMsg).toBe(false)
  })

  it('triggers noSelectionMsg when opening DB action without selection', () => {
    const { result } = renderHook(
      () => useDashboardModals({ ...defaultParams, activeService: 'Database' }),
      { wrapper },
    )

    act(() => {
      result.current.openDbAction('db-connect')
    })

    expect(result.current.noSelectionMsg).toBe(true)
    expect(result.current.modalAction).toBeNull()
  })

  it('triggers noSelectionMsg when opening Network action without selection', () => {
    const { result } = renderHook(
      () => useDashboardModals({ ...defaultParams, activeService: 'Network' }),
      { wrapper },
    )

    act(() => {
      result.current.openNetworkAction('network-delete')
    })

    expect(result.current.noSelectionMsg).toBe(true)
    expect(result.current.modalAction).toBeNull()
  })

  it('triggers noSelectionMsg via handleMenuAction for IAM and Storage actions without selection', () => {
    const { result } = renderHook(
      () => useDashboardModals({ ...defaultParams, activeService: 'IAM' }),
      { wrapper },
    )

    act(() => {
      result.current.handleMenuAction('IAM', 'Edit role')
    })
    expect(result.current.noSelectionMsg).toBe(true)

    act(() => {
      result.current.handleMenuAction('Storage', 'Delete')
    })
    expect(result.current.noSelectionMsg).toBe(true)
  })

  it('opens modal action when valid item is selected', () => {
    const { result } = renderHook(
      () =>
        useDashboardModals({
          ...defaultParams,
          selectedRowId: 'ce-1',
          selectedComputeEngine: mockComputeEngine,
        }),
      { wrapper },
    )

    act(() => {
      result.current.openComputeEngineAction('reboot')
    })

    expect(result.current.noSelectionMsg).toBe(false)
    expect(result.current.modalAction).toBe('reboot')
  })

  it('resets modalAction when closeModal is called', () => {
    const { result } = renderHook(
      () =>
        useDashboardModals({
          ...defaultParams,
          selectedRowId: 'ce-1',
          selectedComputeEngine: mockComputeEngine,
        }),
      { wrapper },
    )

    act(() => {
      result.current.openComputeEngineAction('delete')
    })
    expect(result.current.modalAction).toBe('delete')

    act(() => {
      result.current.closeModal()
    })
    expect(result.current.modalAction).toBeNull()
  })

  it('handles navigation actions for menu items like Launch Compute Engine and Add user', () => {
    const navigateMock = vi.fn()
    const { result } = renderHook(
      () =>
        useDashboardModals({
          ...defaultParams,
          navigate: navigateMock,
        }),
      { wrapper },
    )

    act(() => {
      result.current.handleMenuAction('Compute Engine', 'Launch Compute Engine')
    })
    expect(navigateMock).toHaveBeenCalledWith('/services/compute-engine/create')

    act(() => {
      result.current.handleMenuAction('IAM', 'Add user')
    })
    expect(navigateMock).toHaveBeenCalledWith('/services/iam/create')
  })
})
