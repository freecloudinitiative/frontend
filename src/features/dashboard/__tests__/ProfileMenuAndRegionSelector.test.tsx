import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RegionSelector } from '@/features/dashboard/RegionSelector'
import { ProfileMenu } from '@/features/dashboard/ProfileMenu'
import type { RegionFilter } from '@/store/regionStore'

describe('RegionSelector component', () => {
  const defaultRegionProps = {
    selectedRegion: 'ALL' as RegionFilter,
    setRegion: vi.fn(),
    regionOpen: true,
    toggleRegion: vi.fn(),
    setRegionOpen: vi.fn(),
    setSelectedRowId: vi.fn(),
  }

  it('renders selected region title and dropdown options', () => {
    render(<RegionSelector {...defaultRegionProps} />)

    expect(screen.getByText('Region')).toBeDefined()
    expect(screen.getAllByText('All').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('IST')).toBeDefined()
    expect(screen.getByText('ANK')).toBeDefined()
  })

  it('selects region when an active region item is clicked', () => {
    const setRegionMock = vi.fn()
    const setSelectedRowIdMock = vi.fn()
    const setRegionOpenMock = vi.fn()

    render(
      <RegionSelector
        {...defaultRegionProps}
        setRegion={setRegionMock}
        setSelectedRowId={setSelectedRowIdMock}
        setRegionOpen={setRegionOpenMock}
      />,
    )

    const istItem = screen.getByText('IST')
    fireEvent.click(istItem)

    expect(setRegionMock).toHaveBeenCalledWith('IST')
    expect(setSelectedRowIdMock).toHaveBeenCalledWith(null)
    expect(setRegionOpenMock).toHaveBeenCalledWith(false)
  })

  it('does not select disabled region options like ANK', () => {
    const setRegionMock = vi.fn()

    render(
      <RegionSelector
        {...defaultRegionProps}
        setRegion={setRegionMock}
      />,
    )

    const ankItem = screen.getByText('ANK')
    fireEvent.click(ankItem)

    expect(setRegionMock).not.toHaveBeenCalled()
  })

  it('toggles dropdown when pressed via Space or Enter key', () => {
    const toggleMock = vi.fn()

    render(
      <RegionSelector
        {...defaultRegionProps}
        regionOpen={false}
        toggleRegion={toggleMock}
      />,
    )

    const selector = screen.getByRole('button')
    fireEvent.keyDown(selector, { key: 'Enter' })
    expect(toggleMock).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(selector, { key: ' ' })
    expect(toggleMock).toHaveBeenCalledTimes(2)
  })
})

describe('ProfileMenu component', () => {
  const defaultProfileProps = {
    profileOpen: true,
    setProfileOpen: vi.fn(),
    toggleProfile: vi.fn(),
    isMobile: false,
    isCompact: false,
    theme: 'default' as const,
    setTheme: vi.fn(),
    handleSignOut: vi.fn(),
    showKeyHint: true,
  }

  it('renders profile label, username, and key hint when showKeyHint is true', () => {
    render(<ProfileMenu {...defaultProfileProps} />)

    expect(screen.getByText('Profile')).toBeDefined()
    expect(screen.getByText('root@HEAD')).toBeDefined()
    expect(screen.getByText('(p)')).toBeDefined()
    expect(screen.getByText('My Account')).toBeDefined()
    expect(screen.getByText('Settings')).toBeDefined()
    expect(screen.getByText('Sign out')).toBeDefined()
  })

  it('hides keyboard shortcut hint when showKeyHint is false', () => {
    render(<ProfileMenu {...defaultProfileProps} showKeyHint={false} />)

    expect(screen.queryByText('(p)')).toBeNull()
  })

  it('renders Theme and Link sections on compact/mobile screens and switches theme', () => {
    const setThemeMock = vi.fn()
    const setProfileOpenMock = vi.fn()

    render(
      <ProfileMenu
        {...defaultProfileProps}
        isCompact={true}
        setTheme={setThemeMock}
        setProfileOpen={setProfileOpenMock}
      />,
    )

    expect(screen.getByText('— Theme —')).toBeDefined()
    expect(screen.getByText('— Links —')).toBeDefined()

    const beigeThemeBtn = screen.getByLabelText('Beige theme')
    fireEvent.click(beigeThemeBtn)

    expect(setThemeMock).toHaveBeenCalledWith('beige')
    expect(setProfileOpenMock).toHaveBeenCalledWith(false)
  })

  it('triggers handleSignOut when Sign out item is clicked', () => {
    const handleSignOutMock = vi.fn()

    render(<ProfileMenu {...defaultProfileProps} handleSignOut={handleSignOutMock} />)

    const signOutBtn = screen.getByText('Sign out')
    fireEvent.click(signOutBtn)

    expect(handleSignOutMock).toHaveBeenCalledTimes(1)
  })
})
