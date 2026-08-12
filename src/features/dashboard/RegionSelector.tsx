import type { RegionFilter } from '@/store/regionStore'

interface RegionSelectorProps {
  selectedRegion: RegionFilter
  setRegion: (region: RegionFilter) => void
  regionOpen: boolean
  toggleRegion: (event?: React.MouseEvent) => void
  setRegionOpen: (open: boolean) => void
  setSelectedRowId: (id: string | null) => void
}

export function RegionSelector({
  selectedRegion,
  setRegion,
  regionOpen,
  toggleRegion,
  setRegionOpen,
  setSelectedRowId,
}: RegionSelectorProps) {
  return (
    <div
      className={`fci-box fci-region-selector fci-dropdown${regionOpen ? ' fci-open' : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={regionOpen}
      id="btn-region-selector"
      onClick={toggleRegion}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggleRegion()
        }
      }}
    >
      <div className="fci-box-label">Region</div>
      <span className="fci-region-icon">⊕</span>
      <span className="fci-region-name">{selectedRegion === 'ALL' ? 'All' : selectedRegion}</span>
      <div className="fci-dd-arrow">&#9660;</div>
      <div className="fci-dd-menu">
        {[
          { id: 'ALL' as RegionFilter, label: 'All', disabled: false },
          { id: 'IST' as RegionFilter, label: 'IST', disabled: false },
          { id: 'ANK' as RegionFilter, label: 'ANK', disabled: true },
        ].map(({ id: r, label, disabled }) => (
          <div
            key={r}
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
