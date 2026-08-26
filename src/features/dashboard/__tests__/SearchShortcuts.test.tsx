import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MobileSearchBar } from '@/features/dashboard/TopBar'
import { serviceIdToSlug, shortcutToServiceId } from '@/features/dashboard/serviceCatalog'

function MobileSearch({ navigate }: { navigate: (path: string) => void }) {
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
  })
})
