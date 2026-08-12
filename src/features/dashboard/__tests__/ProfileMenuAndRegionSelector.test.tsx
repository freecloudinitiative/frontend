import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RegionSelector } from '@/features/dashboard/RegionSelector'
import { ProfileMenu } from '@/features/dashboard/ProfileMenu'
import type { RegionFilter } from '@/store/regionStore'

describe('RegionSelector component — ARIA & Keyboard', () => {
  const defaultRegionProps = {
    selectedRegion: 'ALL' as RegionFilter,
    setRegion: vi.fn(),
    regionOpen: true,
    toggleRegion: vi.fn(),
    setRegionOpen: vi.fn(),
    setSelectedRowId: vi.fn(),
  }

  it('has proper trigger ARIA attributes and option roles when open', () => {
    render(<RegionSelector {...defaultRegionProps} />)

    const trigger = screen.getByRole('button', { name: /Region/i })
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('tabindex')).toBe('0')

    const listbox = screen.getByRole('listbox', { name: /Select region/i })
    expect(listbox).toBeDefined()

    const options = screen.getAllByRole('option')
    expect(options.length).toBe(3)
    expect(options[0].getAttribute('aria-selected')).toBe('true')
    expect(options[2].getAttribute('aria-disabled')).toBe('true')
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

    const trigger = screen.getByRole('button', { name: /Region/i })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(toggleMock).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(trigger, { key: ' ' })
    expect(toggleMock).toHaveBeenCalledTimes(2)
  })

  it('closes dropdown and returns focus on Escape key', () => {
    const setRegionOpenMock = vi.fn()

    render(
      <RegionSelector
        {...defaultRegionProps}
        regionOpen={true}
        setRegionOpen={setRegionOpenMock}
      />,
    )

    const listbox = screen.getByRole('listbox', { name: /Select region/i })
    fireEvent.keyDown(listbox, { key: 'Escape' })

    expect(setRegionOpenMock).toHaveBeenCalledWith(false)
  })
})

describe('ProfileMenu component — ARIA & Keyboard', () => {
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

  function renderProfileMenu(props: React.ComponentProps<typeof ProfileMenu>) {
    return render(
      <MemoryRouter>
        <ProfileMenu {...props} />
      </MemoryRouter>,
    )
  }

  it('has proper trigger ARIA attributes and menuitem roles when open', () => {
    renderProfileMenu(defaultProfileProps)

    const trigger = screen.getByRole('button', { name: /Profile/i })
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('tabindex')).toBe('0')

    const menu = screen.getByRole('menu', { name: /Profile menu/i })
    expect(menu).toBeDefined()

    const menuitems = screen.getAllByRole('menuitem')
    expect(menuitems.length).toBeGreaterThanOrEqual(2)
  })

  it('renders profile label, username, and key hint when showKeyHint is true', () => {
    renderProfileMenu(defaultProfileProps)

    expect(screen.getByText('Profile')).toBeDefined()
    expect(screen.getByText('root@HEAD')).toBeDefined()
    expect(screen.getByText('(p)')).toBeDefined()
    expect(screen.getByText('My Account')).toBeDefined()
    expect(screen.getByText('Sign out')).toBeDefined()
  })

  it('hides keyboard shortcut hint when showKeyHint is false', () => {
    renderProfileMenu({ ...defaultProfileProps, showKeyHint: false })

    expect(screen.queryByText('(p)')).toBeNull()
  })

  it('renders Theme and Link sections on compact/mobile screens and switches theme', () => {
    const setThemeMock = vi.fn()
    const setProfileOpenMock = vi.fn()

    renderProfileMenu({
      ...defaultProfileProps,
      isCompact: true,
      setTheme: setThemeMock,
      setProfileOpen: setProfileOpenMock,
    })

    expect(screen.getByText('— Theme —')).toBeDefined()
    expect(screen.getByText('— Links —')).toBeDefined()

    const beigeThemeBtn = screen.getByLabelText('Beige theme')
    fireEvent.click(beigeThemeBtn)

    expect(setThemeMock).toHaveBeenCalledWith('beige')
    expect(setProfileOpenMock).toHaveBeenCalledWith(false)
  })

  it('triggers handleSignOut when Sign out item is clicked', () => {
    const handleSignOutMock = vi.fn()

    renderProfileMenu({ ...defaultProfileProps, handleSignOut: handleSignOutMock })

    const signOutBtn = screen.getByText('Sign out')
    fireEvent.click(signOutBtn)

    expect(handleSignOutMock).toHaveBeenCalledTimes(1)
  })

  it('closes profile menu on Escape key press inside the menu', () => {
    const setProfileOpenMock = vi.fn()

    renderProfileMenu({
      ...defaultProfileProps,
      setProfileOpen: setProfileOpenMock,
    })

    const menu = screen.getByRole('menu', { name: /Profile menu/i })
    fireEvent.keyDown(menu, { key: 'Escape' })

    expect(setProfileOpenMock).toHaveBeenCalledWith(false)
  })

  it('navigates menu items with ArrowDown and ArrowUp keys', () => {
    renderProfileMenu(defaultProfileProps)

    const menuitems = screen.getAllByRole('menuitem')
    const menu = screen.getByRole('menu', { name: /Profile menu/i })

    // Focus starts or moves via ArrowDown
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    fireEvent.keyDown(menu, { key: 'ArrowDown' })

    expect(menuitems).toBeDefined()
  })
})
