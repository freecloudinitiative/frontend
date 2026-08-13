import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TopBar } from '@/features/dashboard/TopBar'
import * as computeEngineHooks from '@/features/computeEngine/hooks'
import type { ComputeEngine } from '@/features/computeEngine/types'

describe('TopBar component — Compute Engine connect action', () => {
  let openSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    openSpy.mockRestore()
    vi.restoreAllMocks()
  })

  const baseProps = {
    activeService: 'Compute Engine' as const,
    navigate: vi.fn(),
    onRefresh: vi.fn(),
    openComputeEngineAction: vi.fn(),
    openDbAction: vi.fn(),
    openNetworkAction: vi.fn(),
    setModalAction: vi.fn(),
    selectedRowId: null,
    selectedIamUser: null,
    selectedBucket: null,
    setIamActionError: vi.fn(),
    setDeleteError: vi.fn(),
    triggerNoSelectionMsg: vi.fn(),
    theme: 'default' as const,
    setTheme: vi.fn(),
    selectedRegion: 'ALL' as const,
    setRegion: vi.fn(),
    regionOpen: false,
    toggleRegion: vi.fn(),
    setSelectedRowId: vi.fn(),
    setRegionOpen: vi.fn(),
    profileOpen: false,
    setProfileOpen: vi.fn(),
    toggleProfile: vi.fn(),
    handleSignOut: vi.fn(),
    isCompact: false,
    isMobile: false,
  }

  it('opens console route with selected compute engine name when available', () => {
    const mockCe: ComputeEngine = {
      id: 'ce-1',
      name: 'prod-api-server',
      status: 'running',
      cpu: 4,
      memory: 16,
      disk: 100,
      diskType: 'SSD',
      ipAddress: '10.0.1.5',
      os: 'debian-12',
      region: 'IST',
      zone: 'ist-1',
      createdAt: '2024-01-01',
    }

    vi.spyOn(computeEngineHooks, 'useComputeEngines').mockReturnValue({
      data: [mockCe],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(
      <MemoryRouter>
        <TopBar {...baseProps} selectedRowId="ce-1" />
      </MemoryRouter>,
    )

    const connectBtn = screen.getByRole('button', { name: /Connect to Compute Engine Serial Console/i })
    fireEvent.click(connectBtn)

    expect(openSpy).toHaveBeenCalledWith('/console/prod-api-server', '_blank', 'noopener,noreferrer')
  })

  it('returns without opening a window when no compute engines exist', () => {
    vi.spyOn(computeEngineHooks, 'useComputeEngines').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(
      <MemoryRouter>
        <TopBar {...baseProps} selectedRowId="ce-nonexistent" />
      </MemoryRouter>,
    )

    const connectBtn = screen.getByRole('button', { name: /Connect to Compute Engine Serial Console/i })
    fireEvent.click(connectBtn)

    expect(openSpy).not.toHaveBeenCalled()
  })
})
