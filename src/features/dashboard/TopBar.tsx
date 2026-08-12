import {
  SERVICES,
  serviceIdToSlug,
  type ServiceId,
} from '@/lib/mockServiceData'
import type { ThemeId } from '@/store/themeStore'
import type { RegionFilter } from '@/store/regionStore'
import { getSearchResults, type ModalAction } from '@/features/dashboard/constants'

interface TopBarProps {
  activeService: ServiceId
  navigate: (path: string) => void
  onRefresh: () => void
  openVmAction: (action: ModalAction) => void
  openDbAction: (action: ModalAction) => void
  openNetworkAction: (action: ModalAction) => void
  setModalAction: (action: ModalAction) => void
  selectedRowId: string | null
  selectedIamUser: { id: string } | null
  selectedBucket: { id: string } | null
  setIamActionError: (error: string | null) => void
  setDeleteError: (error: string | null) => void
  triggerNoSelectionMsg: () => void
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  selectedRegion: RegionFilter
  setRegion: (region: RegionFilter) => void
  regionOpen: boolean
  toggleRegion: (event?: React.MouseEvent) => void
  setSelectedRowId: (id: string | null) => void
  setRegionOpen: (open: boolean) => void
  profileOpen: boolean
  setProfileOpen: (open: boolean) => void
  toggleProfile: (event?: React.MouseEvent) => void
  handleSignOut: (event: React.MouseEvent) => void
  isCompact: boolean
  isMobile: boolean
}

export function TopBar({
  activeService,
  navigate,
  onRefresh,
  openVmAction,
  openDbAction,
  openNetworkAction,
  setModalAction,
  selectedRowId,
  selectedIamUser,
  selectedBucket,
  setIamActionError,
  setDeleteError,
  triggerNoSelectionMsg,
  theme,
  setTheme,
  selectedRegion,
  setRegion,
  regionOpen,
  toggleRegion,
  setSelectedRowId,
  setRegionOpen,
  profileOpen,
  setProfileOpen,
  toggleProfile,
  handleSignOut,
  isCompact,
  isMobile,
}: TopBarProps) {
  return (
    <>
      <div className="fci-topbar-actions">
        {/* 1. Add/Create */}
        <button
          id="btn-mobile-add"
          type="button"
          className="fci-linkbtn fci-topbtn-add"
          title="Create"
          aria-label="Create"
          onClick={() =>
            activeService === 'VM' ? navigate('/services/vm/create')
            : activeService === 'Database' ? navigate('/services/database/create')
            : activeService === 'IAM' ? navigate('/services/iam/create')
            : activeService === 'Storage' ? navigate('/services/storage/create')
            : activeService === 'Network' ? navigate('/services/network/create')
            : window.alert(`Add new ${activeService} resource (demo)`)
          }
        >
          +
        </button>
        {/* 2. Run/Connect button */}
        <button
          id="btn-mobile-run"
          type="button"
          className="fci-linkbtn fci-action-edit"
          title={
            activeService === 'VM' ? 'Connect Console'
            : activeService === 'Database' ? 'Connect Database'
            : activeService === 'IAM' ? 'Connect IAM'
            : activeService === 'Storage' ? 'Upload Storage'
            : 'Connect Network'
          }
          aria-label={
            activeService === 'VM' ? 'Connect to VM Serial Console'
            : activeService === 'Database' ? 'Connect to Database'
            : activeService === 'IAM' ? 'Connect IAM User Details'
            : activeService === 'Storage' ? 'Upload to Storage Bucket'
            : 'Connect Network Details'
          }
          onClick={() => {
            if (activeService === 'VM') navigate('/services/vm/console')
            else if (activeService === 'Database') openDbAction('db-connect')
            else if (activeService === 'IAM') navigate('/services/iam/details')
            else if (activeService === 'Storage') setModalAction('storage-upload')
            else if (activeService === 'Network') navigate('/services/network/details')
          }}
        >
          ▶
        </button>
        {/* 3. Delete button */}
        <button
          id="btn-mobile-delete"
          type="button"
          className="fci-linkbtn fci-action-delete"
          title="Delete"
          aria-label="Delete"
          onClick={() => {
            if (activeService === 'VM') openVmAction('delete')
            else if (activeService === 'Database') openDbAction('db-delete')
            else if (activeService === 'Network') openNetworkAction('network-delete')
            else if (activeService === 'IAM') {
              if (!selectedRowId || !selectedIamUser) {
                triggerNoSelectionMsg()
                return
              }
              setIamActionError(null)
              setModalAction('iam-delete')
            }
            else if (activeService === 'Storage') {
              if (!selectedRowId || !selectedBucket) {
                triggerNoSelectionMsg()
                return
              }
              setDeleteError(null)
              setModalAction('storage-delete')
            }
          }}
        >
          ✕
        </button>
        {/* 4. Refresh */}
        <button
          id="btn-mobile-refresh"
          type="button"
          className="fci-linkbtn fci-topbtn-refresh"
          title="Refresh"
          aria-label="Refresh"
          onClick={onRefresh}
        >
          ↻
        </button>
        {/* 5. Settings */}
        <button
          id="btn-mobile-settings"
          type="button"
          className="fci-linkbtn fci-topbtn-settings"
          title="Settings"
          aria-label="Settings"
          onClick={() => activeService === 'VM' ? navigate('/services/vm/settings') : window.alert('Settings (demo)')}
        >
          ⚙
        </button>
        {/* 6. Region */}
        <div
          className={`fci-box fci-region-selector fci-dropdown${regionOpen ? ' fci-open' : ''}`}
          role="button"
          tabIndex={0}
          id="btn-region-selector"
          onClick={toggleRegion}
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
        {/* 7. Profile (Far right end) */}
        <div
          className={`fci-box fci-profile fci-dropdown${profileOpen ? ' fci-open' : ''}`}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (!target.closest('.fci-dd-menu')) {
              toggleProfile(e)
            }
          }}
        >
          <div className="fci-box-label">Profile</div>
          <span className="fci-profile-icon">&#9786;</span>
          <span className="fci-profile-name">root@HEAD</span>
          <div className="fci-dd-arrow">&#9660;</div>
          <div className="fci-dd-menu" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            <div className="fci-dd-item" onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}>My Account</div>
            <div className="fci-dd-item" onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}>Settings</div>
            {/* Relocated utility controls on mobile and compact screens (max-width: 1450px) */}
            {(isMobile || isCompact) && (
              <>
                <div className="fci-dd-header-label">— Theme —</div>
                <div className="fci-mobile-theme-row" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                  {([
                    { id: 'beige', label: 'Beige', bg: '#ece0c8', border: '#9c7a45' },
                    { id: 'mono', label: 'Black & white', bg: '#000000', border: '#ffffff' },
                    { id: 'default', label: 'Default', bg: '#000000', border: '#3a6ea5' },
                    { id: 'navy', label: 'Dark navy', bg: '#0a0e1a', border: '#3a4166' },
                  ] as const).map((swatch) => (
                    <button
                      key={swatch.id}
                      type="button"
                      title={swatch.label}
                      aria-label={`${swatch.label} theme`}
                      aria-pressed={theme === swatch.id}
                      className={`fci-theme-btn${theme === swatch.id ? ' fci-theme-btn-active' : ''}`}
                      style={{ background: swatch.bg, borderColor: swatch.border }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setTheme(swatch.id)
                        setProfileOpen(false)
                      }}
                      onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setTheme(swatch.id)
                        setProfileOpen(false)
                      }}
                    />
                  ))}
                </div>

                <div className="fci-dd-header-label">— Links —</div>
                <a
                  href="https://theomerkaratas.github.io/resume/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fci-dd-item fci-dd-link"
                  onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  👤 About Creator
                </a>
                <a
                  href="https://freecloudinitiative.github.io/docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fci-dd-item fci-dd-link"
                  onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  📄 Docs
                </a>
                <a
                  href="https://grafana.example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fci-dd-item fci-dd-link"
                  onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  📊 Grafana
                </a>
                <a
                  href="https://prometheus.example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fci-dd-item fci-dd-link"
                  onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  🔥 Prometheus
                </a>
                <a
                  href="https://loki.example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fci-dd-item fci-dd-link"
                  onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  📝 Loki
                </a>
                <a
                  href="https://chaos.example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fci-dd-item fci-dd-link"
                  onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  🧪 Chaos Demo
                </a>
                <a
                  href="https://architecture.example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fci-dd-item fci-dd-link"
                  onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  🏛 Architecture
                </a>
              </>
            )}
            <div className="fci-dd-item fci-dd-item-danger" style={{ borderTop: '1px solid var(--dash-border-subtle)', marginTop: 4 }} onClick={handleSignOut}>Sign out</div>
          </div>
        </div>
      </div>
    </>
  )
}

interface MobileSearchBarProps {
  activeService: ServiceId
  navigate: (path: string) => void
  setSelectedRowId: (id: string | null) => void
  handleMenuAction: (serviceId: ServiceId, label: string) => void
  topSearchFocused: boolean
  setTopSearchFocused: (focused: boolean) => void
  topSearchQuery: string
  setTopSearchQuery: (query: string) => void
}

export function MobileSearchBar({
  activeService,
  navigate,
  setSelectedRowId,
  handleMenuAction,
  topSearchFocused,
  setTopSearchFocused,
  topSearchQuery,
  setTopSearchQuery,
}: MobileSearchBarProps) {
  return (
    <>
      {/* ── Mobile search bar at bottom ─────────────────────────────────── */}
      {/* Mobile-only pinned footer search bar with blurred overlay, keyboard docking, and search results */}
      {topSearchFocused && (
        <div
          className="fci-mobile-search-overlay"
          onClick={() => setTopSearchFocused(false)}
        />
      )}

      <div className={`fci-mobile-search-bar${topSearchFocused ? ' fci-mobile-search-focused' : ''}`}>
        {topSearchFocused && topSearchQuery.trim() !== '' && (
          <div className="fci-mobile-search-results">
            <div className="fci-dd-header-label">— Search Results —</div>
            {(() => {
              const allResults = SERVICES.flatMap((s) =>
                getSearchResults(s.id, topSearchQuery).map((r) => ({ ...r, serviceId: s.id }))
              )
              if (allResults.length === 0) {
                return <div className="fci-search-no-results">No matching results found</div>
              }
              const handleSearchResultSelect = (result: (typeof allResults)[number]) => {
                setTopSearchQuery('')
                setTopSearchFocused(false)
                if (result.kind === 'tab' && result.slug) {
                  setSelectedRowId(null)
                  navigate(`/services/${serviceIdToSlug(result.serviceId)}/${result.slug}`)
                } else {
                  if (activeService !== result.serviceId) {
                    navigate(`/services/${serviceIdToSlug(result.serviceId)}/details`)
                  }
                  handleMenuAction(result.serviceId, result.label)
                }
              }
              return allResults.map((result, idx) => (
                <div
                  key={`${result.serviceId}-${result.label}-${idx}`}
                  className={`fci-dd-item fci-search-result${result.kind === 'action' && result.danger ? ' fci-dd-item-danger' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSearchResultSelect(result)
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSearchResultSelect(result)
                  }}
                >
                  <span className={`fci-search-kind fci-kind-${result.kind}`}>{result.serviceId}: {result.kind}</span>
                  {result.label}
                </div>
              ))
            })()}
          </div>
        )}
        <div className="fci-box fci-topsearch-box" style={{ flex: '1 1 0', minWidth: 0 }}>
          <div className="fci-box-label">Search</div>
          <div
            className={`fci-terminal-wrap${topSearchFocused ? ' fci-focused' : ''}`}
            style={{ '--fci-chars': topSearchQuery.length } as React.CSSProperties}
          >
            <input
              type="text"
              className="fci-service-search"
              placeholder="search all…"
              value={topSearchQuery}
              onFocus={() => setTopSearchFocused(true)}
              onChange={(e) => setTopSearchQuery(e.target.value)}
              onBlur={() => {
                // Short delay to allow result taps to register before blur closes focused state
                setTimeout(() => setTopSearchFocused(false), 200)
              }}
            />
          </div>
          <div className="fci-box-key">(s)</div>
        </div>
      </div>
    </>
  )
}
