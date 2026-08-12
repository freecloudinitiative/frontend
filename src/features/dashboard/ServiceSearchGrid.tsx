import type { RefObject } from 'react'
import { SERVICES, type ServiceId } from '@/lib/mockServiceData'
import type { ThemeId } from '@/store/themeStore'
import type { RegionFilter } from '@/store/regionStore'
import { SERVICE_ICONS } from '@/features/dashboard/icons'
import { RegionSelector } from '@/features/dashboard/RegionSelector'
import { ProfileMenu } from '@/features/dashboard/ProfileMenu'
import { GlobalSearchOverlay } from '@/features/dashboard/GlobalSearchOverlay'
import type { GlobalSearchResult } from '@/features/dashboard/useGlobalSearch'

interface ServiceSearchGridProps {
  activeService: ServiceId
  isMobile: boolean
  isCompact: boolean
  navigate?: (path: string) => void
  searchQuery?: Record<ServiceId, string>
  setSearchQuery?: (updater: (prev: Record<ServiceId, string>) => Record<ServiceId, string>) => void
  focusedService?: ServiceId | null
  setFocusedService?: (service: ServiceId | null) => void
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
  // Global cross-service search
  globalSearchResults?: GlobalSearchResult[]
  onSelectGlobalResult?: (result: GlobalSearchResult) => void
}

export function ServiceSearchGrid({
  activeService,
  isMobile,
  isCompact,
  selectService,
  setSelectedRowId,
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
  globalSearchResults = [],
  onSelectGlobalResult = () => {},
}: ServiceSearchGridProps) {

  return (
    <>
      {/* ── Service grid ─────────────────────────────────────────────────── */}
      <div className="fci-topgrid">
        {SERVICES.map((service) => {
          const isActive = service.id === activeService
          return (
            <button
              key={service.id}
              type="button"
              className={`fci-box fci-servicebox${isActive ? ' fci-active-service' : ''}`}
              onClick={() => selectService(service.id)}
              aria-label={`Select ${service.id} service (${service.shortcode})`}
            >
              {/* SVG Icon */}
              <span className="fci-svc-icon" aria-hidden="true">
                {SERVICE_ICONS[service.id]}
              </span>
              {/* Service Label */}
              <span className="fci-box-label">{service.id}</span>
              {/* Shortcode Hint */}
              <span className="fci-box-key">({service.shortcode})</span>
            </button>
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
            placeholder="search all resources…"
            value={topSearchQuery}
            aria-label="Global resource search"
            aria-autocomplete="list"
            aria-expanded={topSearchFocused && topSearchQuery.trim().length > 0}
            aria-controls={topSearchFocused ? 'fci-global-search-listbox' : undefined}
            onFocus={() => setTopSearchFocused(true)}
            onChange={(e) => setTopSearchQuery(e.target.value)}
            onBlur={() => {
              // Delay so mousedown on a result fires before blur closes the overlay
              setTimeout(() => setTopSearchFocused(false), 150)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setTopSearchQuery('')
                setTopSearchFocused(false)
              }
            }}
          />
        </div>
        <div className="fci-box-key">(s)</div>
        {/* Global search results dropdown */}
        {topSearchFocused && (
          <div id="fci-global-search-listbox">
            <GlobalSearchOverlay
              query={topSearchQuery}
              results={globalSearchResults}
              onClose={() => { setTopSearchFocused(false); setTopSearchQuery('') }}
              onSelectResult={(result) => {
                setTopSearchFocused(false)
                setTopSearchQuery('')
                onSelectGlobalResult(result)
              }}
            />
          </div>
        )}
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
