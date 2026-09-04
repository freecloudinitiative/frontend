import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MobileSearchBar } from '@/features/dashboard/TopBar'
import { serviceIdToSlug, shortcutToServiceId, type ServiceId } from '@/features/dashboard/serviceCatalog'

interface MobileSearchProps {
  navigate: (path: string) => void
  activeService?: ServiceId
  selectedRowId?: string | null
  handleMenuAction?: (serviceId: ServiceId, label: string) => void
}

function MobileSearch({
  navigate,
  activeService = 'Compute Engine',
  selectedRowId = null,
  handleMenuAction = vi.fn(),
}: MobileSearchProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  return (
    <MobileSearchBar
      activeService={activeService}
      selectedRowId={selectedRowId}
      navigate={navigate}
      handleMenuAction={handleMenuAction}
      topSearchFocused={focused}
      setTopSearchFocused={setFocused}
      topSearchQuery={query}
      setTopSearchQuery={setQuery}
    />
  )
}

describe('service search shortcuts', () => {
  it('renders the full-width search field without the obsolete duration indicator', () => {
    render(<MobileSearch navigate={vi.fn()} />)

    expect(screen.getByPlaceholderText('search all…')).toBeInTheDocument()
    expect(screen.queryByText('(s)')).not.toBeInTheDocument()
  })

  it('requires an exact colon-prefixed service shortcode', () => {
    expect(shortcutToServiceId('str')).toBeUndefined()
    expect(shortcutToServiceId('ce')).toBeUndefined()
    expect(shortcutToServiceId('iam')).toBeUndefined()
    expect(shortcutToServiceId(':str')).toBe('Storage')
    expect(shortcutToServiceId(':CE')).toBe('Compute Engine')
    expect(shortcutToServiceId(':iam')).toBe('IAM')
    expect(shortcutToServiceId(':es')).toBe('Elasticsearch')
    expect(shortcutToServiceId(':kfk')).toBe('Kafka')
  })

  it('maps the new services to their route slugs', () => {
    expect(serviceIdToSlug('Elasticsearch')).toBe('elasticsearch')
    expect(serviceIdToSlug('Kafka')).toBe('kafka')
  })

  it('runs colon-prefixed shortcuts from the mobile search input', () => {
    const navigate = vi.fn<(path: string) => void>()
    render(<MobileSearch navigate={navigate} />)

    fireEvent.change(screen.getByPlaceholderText('search all…'), { target: { value: ':ce' } })

    expect(navigate).toHaveBeenCalledWith('/services/compute-engine/info')
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it('keeps the selected resource when opening an instance-scoped result for the active service', () => {
    const navigate = vi.fn<(path: string) => void>()
    render(<MobileSearch navigate={navigate} activeService="Database" selectedRowId="db-1" />)

    const search = screen.getByPlaceholderText('search all…')
    fireEvent.focus(search)
    fireEvent.change(search, { target: { value: 'Connections' } })
    fireEvent.mouseDown(screen.getByText('Connections'))

    expect(navigate).toHaveBeenCalledWith('/services/database/db-1/connections')
  })

  it('falls back to service info when an instance-scoped result belongs to another service', () => {
    const navigate = vi.fn<(path: string) => void>()
    render(<MobileSearch navigate={navigate} />)

    const search = screen.getByPlaceholderText('search all…')
    fireEvent.focus(search)
    fireEvent.change(search, { target: { value: 'Connections' } })
    fireEvent.mouseDown(screen.getByText('Connections'))

    expect(navigate).toHaveBeenCalledWith('/services/database/info')
  })

  it('navigates to another service before running its action', () => {
    const navigate = vi.fn<(path: string) => void>()
    const handleMenuAction = vi.fn()
    render(<MobileSearch navigate={navigate} handleMenuAction={handleMenuAction} />)

    const search = screen.getByPlaceholderText('search all…')
    fireEvent.focus(search)
    fireEvent.change(search, { target: { value: 'Create VPN' } })
    fireEvent.mouseDown(screen.getByText('Create VPN'))

    expect(navigate).toHaveBeenCalledWith('/services/network/info')
    expect(handleMenuAction).not.toHaveBeenCalled()
  })

  it('runs an action directly when it belongs to the active service', () => {
    const navigate = vi.fn<(path: string) => void>()
    const handleMenuAction = vi.fn()
    render(<MobileSearch navigate={navigate} handleMenuAction={handleMenuAction} />)

    const search = screen.getByPlaceholderText('search all…')
    fireEvent.focus(search)
    fireEvent.change(search, { target: { value: 'Reboot' } })
    fireEvent.mouseDown(screen.getByText('Reboot'))

    expect(handleMenuAction).toHaveBeenCalledWith('Compute Engine', 'Reboot')
    expect(navigate).not.toHaveBeenCalled()
  })
})
