import type { RefObject } from 'react'
import {
  SERVICES,
  serviceIdToSlug,
  type ServiceId,
} from '@/lib/mockServiceData'
import type { ThemeId } from '@/store/themeStore'
import type { RegionFilter } from '@/store/regionStore'
import { SERVICE_ICONS } from '@/features/dashboard/icons'
import { getSearchResults } from '@/features/dashboard/constants'

interface ServiceSearchGridProps {
  activeService: ServiceId
  isMobile: boolean
  isCompact: boolean
  navigate: (path: string) => void
  searchQuery: Record<ServiceId, string>
  setSearchQuery: (updater: (prev: Record<ServiceId, string>) => Record<ServiceId, string>) => void
  focusedService: ServiceId | null
  setFocusedService: (service: ServiceId | null) => void
  selectService: (id: ServiceId) => void
  setSelectedRowId: (id: string | null) => void
  handleMenuAction: (serviceId: ServiceId, label: string) => void
  globalSearchRef: RefObject<HTMLInputElement | null>
  topSearchQuery: string
  setTopSearchQuery: (query: string) => void
  topSearchFocused: boolean
  setTopSearchFocused: (focused: boolean) => void
  selectedRegion: RegionFilter
  setRegion: (region: RegionFilter) => void
  regionOpen: boolean
  toggleRegion: (event?: React.MouseEvent) => void
  setRegionOpen: (open: boolean) => void
  profileOpen: boolean
  setProfileOpen: (open: boolean) => void
  toggleProfile: (event?: React.MouseEvent) => void
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  handleSignOut: (event: React.MouseEvent) => void
}

export function ServiceSearchGrid({
  activeService,
  isMobile,
  isCompact,
  navigate,
  searchQuery,
  setSearchQuery,
  focusedService,
  setFocusedService,
  selectService,
  setSelectedRowId,
  handleMenuAction,
  globalSearchRef,
  topSearchQuery,
  setTopSearchQuery,
  topSearchFocused,
  setTopSearchFocused,
  selectedRegion,
  setRegion,
  regionOpen,
  toggleRegion,
  setRegionOpen,
  profileOpen,
  setProfileOpen,
  toggleProfile,
  theme,
  setTheme,
  handleSignOut,
}: ServiceSearchGridProps) {
  return (
    <>
      {/* ── Service grid ─────────────────────────────────────────────────── */}
      <div className="fci-topgrid">
        {SERVICES.map((service) => {
          const isActive = service.id === activeService
          const isFocused = focusedService === service.id
          const query = searchQuery[service.id]
          const results = getSearchResults(service.id, query)
          return (
            <div
              key={service.id}
              className={`fci-box fci-servicebox${isActive ? ' fci-active-service' : ''}`}
              onClick={isMobile ? () => selectService(service.id) : undefined}
            >
              {/* Icon (mobile only — shown via CSS) */}
              <span className="fci-svc-icon" aria-hidden="true">{SERVICE_ICONS[service.id]}</span>
              <div
                className="fci-box-label"
                style={{ cursor: 'pointer' }}
                onClick={!isMobile ? () => selectService(service.id) : undefined}
              >
                {service.id}
              </div>
              <div
                className={`fci-terminal-wrap${isFocused ? ' fci-focused' : ''}`}
                style={{ '--fci-chars': query.length } as React.CSSProperties}
              >
                <input
                  type="text"
                  className="fci-service-search"
                  placeholder="search sections…"
                  value={query}
                  readOnly={isMobile}
                  tabIndex={isMobile ? -1 : undefined}
                  onFocus={() => !isMobile && setFocusedService(service.id)}
                  onChange={(e) => {
                    if (isMobile) return
                    setSearchQuery((prev) => ({ ...prev, [service.id]: e.target.value }))
                    setFocusedService(service.id)
                  }}
                  onBlur={() => setTimeout(() => setFocusedService(null), 120)}
                />
              </div>
              <div className="fci-box-key">({service.shortcode})</div>
              {isFocused && query.trim() && (
                <div className="fci-search-dropdown">
                  {results.length > 0 ? (
                    results.map((result) =>
                      result.kind === 'tab' ? (
                        <div
                          key={result.slug}
                          className="fci-dd-item fci-search-result"
                          onMouseDown={() => {
                            setSearchQuery((prev) => ({ ...prev, [service.id]: '' }))
                            setFocusedService(null)
                            navigate(`/services/${serviceIdToSlug(service.id)}/${result.slug}`)
                            setSelectedRowId(null)
                          }}
                        >
                          <span className="fci-search-kind fci-kind-tab">tab</span>
                          {result.label}
                        </div>
                      ) : (
                        <div
                          key={result.label}
                          className={`fci-dd-item fci-search-result${result.danger ? ' fci-dd-item-danger' : ''}`}
                          onMouseDown={() => {
                            setSearchQuery((prev) => ({ ...prev, [service.id]: '' }))
                            setFocusedService(null)
                            handleMenuAction(service.id, result.label)
                          }}
                        >
                          <span className="fci-search-kind fci-kind-action">action</span>
                          {result.label}
                        </div>
                      )
                    )
                  ) : (
                    <div className="fci-search-no-results">No section available</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Desktop: Search box ──────────────────────────────────────────── */}
      <div className="fci-box fci-topsearch-box">
        <div className="fci-box-label">Search</div>
        <div
          className={`fci-terminal-wrap${topSearchFocused ? ' fci-focused' : ''}`}
          style={{ '--fci-chars': topSearchQuery.length } as React.CSSProperties}
        >
          <input
            ref={globalSearchRef}
            type="text"
            className="fci-service-search"
            placeholder="search all…"
            value={topSearchQuery}
            onFocus={() => setTopSearchFocused(true)}
            onChange={(e) => setTopSearchQuery(e.target.value)}
            onBlur={() => setTopSearchFocused(false)}
          />
        </div>
        <div className="fci-box-key">(s)</div>
      </div>

      {/* ── Desktop: Region Selector ─────────────────────────────────────── */}
      {!isMobile && (
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
      )}

      {/* ── Desktop: Profile ─────────────────────────────────────────────── */}
      {!isMobile && (
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
          <div className="fci-box-key">(p)</div>
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
      )}
    </>
  )
}
