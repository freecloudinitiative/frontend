import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GlobalSearchOverlay } from '../GlobalSearchOverlay'
import type { GlobalSearchResult } from '../useGlobalSearch'

const mockResults: GlobalSearchResult[] = [
  {
    id: 'vm-1',
    name: 'web-prod-01',
    status: 'running',
    serviceId: 'VM',
    serviceSlug: 'vm',
    subtitle: 'ANK · Ubuntu 22.04 · running',
    typeBadge: 'vm',
  },
  {
    id: 'db-1',
    name: 'main-db-prod',
    status: 'running',
    serviceId: 'Database',
    serviceSlug: 'database',
    subtitle: 'IST · postgres · running',
    typeBadge: 'db',
  },
]

describe('GlobalSearchOverlay component', () => {
  it('renders nothing when query is empty', () => {
    const { container } = render(
      <GlobalSearchOverlay query="" results={mockResults} onClose={vi.fn()} onSelectResult={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders empty message when query is non-empty but results are empty', () => {
    render(
      <GlobalSearchOverlay query="nonexistent" results={[]} onClose={vi.fn()} onSelectResult={vi.fn()} />
    )
    expect(screen.getByText(/No resources found for/i)).toBeInTheDocument()
  })

  it('renders results with service badges and subtitles', () => {
    render(
      <GlobalSearchOverlay query="prod" results={mockResults} onClose={vi.fn()} onSelectResult={vi.fn()} />
    )
    expect(screen.getByText('web-prod-01')).toBeInTheDocument()
    expect(screen.getByText('main-db-prod')).toBeInTheDocument()
    expect(screen.getByText('vm')).toBeInTheDocument()
    expect(screen.getByText('db')).toBeInTheDocument()
  })

  it('calls onSelectResult when a result item is clicked', () => {
    const handleSelect = vi.fn()
    render(
      <GlobalSearchOverlay query="prod" results={mockResults} onClose={vi.fn()} onSelectResult={handleSelect} />
    )
    fireEvent.mouseDown(screen.getByText('web-prod-01'))
    expect(handleSelect).toHaveBeenCalledWith(mockResults[0])
  })

  it('handles arrow key navigation and Enter selection', () => {
    const handleSelect = vi.fn()
    const handleClose = vi.fn()
    render(
      <GlobalSearchOverlay query="prod" results={mockResults} onClose={handleClose} onSelectResult={handleSelect} />
    )

    const overlay = screen.getByRole('listbox')
    fireEvent.keyDown(overlay, { key: 'ArrowDown' })
    fireEvent.keyDown(overlay, { key: 'Enter' })
    expect(handleSelect).toHaveBeenCalledWith(mockResults[0])

    fireEvent.keyDown(overlay, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalled()
  })
})
