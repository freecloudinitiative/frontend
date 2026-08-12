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
import { RegionSelector } from '@/features/dashboard/RegionSelector'
import { ProfileMenu } from '@/features/dashboard/ProfileMenu'

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
        <RegionSelector
          selectedRegion={selectedRegion}
          setRegion={setRegion}
          regionOpen={regionOpen}
          toggleRegion={toggleRegion}
          setRegionOpen={setRegionOpen}
          setSelectedRowId={setSelectedRowId}
        />
      )}

      {/* ── Desktop: Profile ─────────────────────────────────────────────── */}
      {!isMobile && (
        <ProfileMenu
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          toggleProfile={toggleProfile}
          isMobile={isMobile}
          isCompact={isCompact}
          theme={theme}
          setTheme={setTheme}
          handleSignOut={handleSignOut}
          showKeyHint={true}
        />
      )}
    </>
  )
}
