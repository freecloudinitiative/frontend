import { useRef, useCallback } from 'react'
import type { RegionFilter } from '@/store/regionStore'

interface RegionSelectorProps {
  selectedRegion: RegionFilter
  setRegion: (region: RegionFilter) => void
  regionOpen: boolean
  toggleRegion: (event?: React.MouseEvent) => void
  setRegionOpen: (open: boolean) => void
  setSelectedRowId: (id: string | null) => void
}

const REGION_OPTIONS: { id: RegionFilter; label: string; disabled: boolean }[] = [
  { id: 'IST', label: 'IST', disabled: false },
  { id: 'ANK', label: 'ANK', disabled: true },
]

export function RegionSelector({
  selectedRegion,
  setRegion,
  regionOpen,
  toggleRegion,
  setRegionOpen,
  setSelectedRowId,
}: RegionSelectorProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)

  const focusOption = useCallback((index: number) => {
    const items = listboxRef.current?.querySelectorAll<HTMLElement>('[role="option"]')
    items?.[index]?.focus()
  }, [])

  const getEnabledIndices = useCallback(() => {
    return REGION_OPTIONS
      .map((opt, idx) => ({ idx, disabled: opt.disabled }))
      .filter((o) => !o.disabled)
      .map((o) => o.idx)
  }, [])

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target as HTMLElement).closest('.fci-dd-menu')) {
      e.preventDefault()
      toggleRegion()
      // Focus first option when opening via keyboard
      if (!regionOpen) {
        requestAnimationFrame(() => {
          const indices = getEnabledIndices()
          if (indices.length > 0) focusOption(indices[0])
        })
      }
    }
    if (e.key === 'ArrowDown' && !regionOpen) {
      e.preventDefault()
      toggleRegion()
      requestAnimationFrame(() => {
        const indices = getEnabledIndices()
        if (indices.length > 0) focusOption(indices[0])
      })
    }
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    const indices = getEnabledIndices()
    if (indices.length === 0) return

    const items = listboxRef.current?.querySelectorAll<HTMLElement>('[role="option"]')
    if (!items) return

    const currentIdx = Array.from(items).findIndex((el) => el === document.activeElement)
    const currentEnabledPos = indices.indexOf(currentIdx)

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const nextPos = currentEnabledPos < indices.length - 1 ? currentEnabledPos + 1 : 0
        focusOption(indices[nextPos])
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prevPos = currentEnabledPos > 0 ? currentEnabledPos - 1 : indices.length - 1
        focusOption(indices[prevPos])
        break
      }
      case 'Home': {
        e.preventDefault()
        focusOption(indices[0])
        break
      }
      case 'End': {
        e.preventDefault()
        focusOption(indices[indices.length - 1])
        break
      }
      case 'Enter':
      case ' ': {
        e.preventDefault()
        if (currentIdx >= 0) {
          const opt = REGION_OPTIONS[currentIdx]
          if (!opt.disabled) {
            setRegion(opt.id)
            setSelectedRowId(null)
            setRegionOpen(false)
            triggerRef.current?.focus()
          }
        }
        break
      }
      case 'Escape': {
        e.preventDefault()
        setRegionOpen(false)
        triggerRef.current?.focus()
        break
      }
    }
  }

  return (
    <div
      ref={triggerRef}
      className={`fci-box fci-region-selector fci-dropdown${regionOpen ? ' fci-open' : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={regionOpen}
      aria-haspopup="listbox"
      id="btn-region-selector"
      onClick={toggleRegion}
      onKeyDown={handleTriggerKeyDown}
    >
      <div className="fci-box-label">Region</div>
      <span className="fci-region-icon">{'\u2295'}</span>
      <span className="fci-region-name">{selectedRegion}</span>
      <div className="fci-dd-arrow">{'\u25BC'}</div>
      <div
        ref={listboxRef}
        className="fci-dd-menu"
        role="listbox"
        aria-label="Select region"
        onKeyDown={handleListKeyDown}
      >
        {REGION_OPTIONS.map(({ id: r, label, disabled }) => (
          <div
            key={r}
            role="option"
            tabIndex={-1}
            aria-selected={selectedRegion === r}
            aria-disabled={disabled || undefined}
            className={`fci-dd-item${selectedRegion === r ? ' fci-dd-item-active' : ''}${disabled ? ' fci-dd-item-disabled' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              if (disabled) return
              setRegion(r)
              setSelectedRowId(null)
              setRegionOpen(false)
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
