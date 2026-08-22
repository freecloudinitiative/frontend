import { fireEvent, render, screen } from '@testing-library/react'
import { useRef, useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ServiceSearchGrid } from '@/features/dashboard/ServiceSearchGrid'
import { MobileSearchBar } from '@/features/dashboard/TopBar'
import { shortcutToServiceId } from '@/features/dashboard/serviceCatalog'

function DesktopSearch({ selectService }: { selectService: ReturnType<typeof vi.fn> }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  return (
    <ServiceSearchGrid
      activeService="Compute Engine"
      isMobile={false}
      isCompact={false}
      selectService={selectService}
      setSelectedRowId={vi.fn()}
      handleMenuAction={vi.fn()}
      globalSearchRef={searchRef}
      topSearchQuery={query}
      setTopSearchQuery={setQuery}
      topSearchFocused={focused}
      setTopSearchFocused={setFocused}
      selectedRegion="ALL"
      setRegion={vi.fn()}
      regionOpen={false}
      toggleRegion={vi.fn()}
      setRegionOpen={vi.fn()}
      profileOpen={false}
      setProfileOpen={vi.fn()}
      toggleProfile={vi.fn()}
      theme="amber"
      setTheme={vi.fn()}
      handleSignOut={vi.fn()}
    />
  )
}

function MobileSearch({ navigate }: { navigate: ReturnType<typeof vi.fn> }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  return (
    <MobileSearchBar
      activeService="Compute Engine"
      navigate={navigate}
      setSelectedRowId={vi.fn()}
      handleMenuAction={vi.fn()}
      topSearchFocused={focused}
      setTopSearchFocused={setFocused}
      topSearchQuery={query}
      setTopSearchQuery={setQuery}
    />
  )
}

describe('service search shortcuts', () => {
  it('requires an exact colon-prefixed service shortcode', () => {
    expect(shortcutToServiceId('str')).toBeUndefined()
    expect(shortcutToServiceId('ce')).toBeUndefined()
    expect(shortcutToServiceId('iam')).toBeUndefined()
    expect(shortcutToServiceId(':str')).toBe('Storage')
    expect(shortcutToServiceId(':CE')).toBe('Compute Engine')
    expect(shortcutToServiceId(':iam')).toBe('IAM')
  })

  it('runs shortcuts from the desktop search input only after the colon prefix is present', () => {
    const selectService = vi.fn()
    render(
      <MemoryRouter>
        <DesktopSearch selectService={selectService} />
      </MemoryRouter>,
    )
    const search = screen.getByRole('textbox', { name: 'Global resource search' })

    fireEvent.change(search, { target: { value: 'str' } })
    expect(selectService).not.toHaveBeenCalled()

    fireEvent.change(search, { target: { value: ':str' } })
    expect(selectService).toHaveBeenCalledWith('Storage')
    expect(search).toHaveValue('')
  })

  it('runs colon-prefixed shortcuts from the mobile search input', () => {
    const navigate = vi.fn()
    render(<MobileSearch navigate={navigate} />)

    fireEvent.change(screen.getByPlaceholderText('search all…'), { target: { value: ':ce' } })

    expect(navigate).toHaveBeenCalledWith('/services/compute-engine/info')
  })
})
