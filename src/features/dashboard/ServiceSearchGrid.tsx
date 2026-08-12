import { useState } from 'react'
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
import { GlobalSearchOverlay } from '@/features/dashboard/GlobalSearchOverlay'
import type { GlobalSearchResult } from '@/features/dashboard/useGlobalSearch'

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
  // Global cross-service search
  globalSearchResults?: GlobalSearchResult[]
  onSelectGlobalResult?: (result: GlobalSearchResult) => void
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
  globalSearchResults = [],
  onSelectGlobalResult = () => {},
}: ServiceSearchGridProps) {
  // Track highlighted search result index per service (local UI state)
  const [highlightIdx, setHighlightIdx] = useState(-1)

  function activateResult(
    serviceId: ServiceId,
    result: ReturnType<typeof getSearchResults>[number],
  ) {
    setSearchQuery((prev) => ({ ...prev, [serviceId]: '' }))
    setFocusedService(null)
    setHighlightIdx(-1)
    if (result.kind === 'tab' && result.slug) {
      navigate(`/services/${serviceIdToSlug(serviceId)}/${result.slug}`)
      setSelectedRowId(null)
    } else {
      handleMenuAction(serviceId, result.label)
    }
  }

  function handleSearchKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    serviceId: ServiceId,
    results: ReturnType<typeof getSearchResults>,
  ) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setSearchQuery((prev) => ({ ...prev, [serviceId]: '' }))
      setFocusedService(null)
      setHighlightIdx(-1)
      return
    }
    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIdx >= 0 && highlightIdx < results.length) {
        activateResult(serviceId, results[highlightIdx])
      } else if (results.length === 1) {
        activateResult(serviceId, results[0])
      }
    }
  }

  return (
    <>
      {/* ── Service grid ─────────────────────────────────────────────────── */}
      <div className="fci-topgrid">
        {SERVICES.map((service) => {
          const isActive = service.id === activeService
          const isFocused = focusedService === service.id
          const query = searchQuery[service.id]
          const results = getSearchResults(service.id, query)
          const showDropdown = isFocused && query.trim() !== ''
          const listboxId = `fci-svc-search-listbox-${service.id}`
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
                  role="combobox"
                  aria-expanded={showDropdown && results.length > 0}
                  aria-controls={showDropdown ? listboxId : undefined}
                  aria-activedescendant={
                    showDropdown && highlightIdx >= 0
                      ? `fci-svc-search-item-${service.id}-${highlightIdx}`
                      : undefined
                  }
                  aria-autocomplete="list"
                  aria-label={`Search ${service.id} sections`}
                  onFocus={() => {
                    if (!isMobile) {
                      setFocusedService(service.id)
                      setHighlightIdx(-1)
                    }
                  }}
                  onChange={(e) => {
                    if (isMobile) return
                    setSearchQuery((prev) => ({ ...prev, [service.id]: e.target.value }))
                    setFocusedService(service.id)
                    setHighlightIdx(-1)
                  }}
                  onBlur={() => setTimeout(() => {
                    setFocusedService(null)
                    setHighlightIdx(-1)
                  }, 120)}
                  onKeyDown={(e) => handleSearchKeyDown(e, service.id, results)}
                />
              </div>
              <div className="fci-box-key">({service.shortcode})</div>
              {showDropdown && (
                <div
                  className="fci-search-dropdown"
                  id={listboxId}
                  role="listbox"
                  aria-label={`${service.id} search results`}
                >
                  {results.length > 0 ? (
                    results.map((result, idx) => {
                      const isHighlighted = idx === highlightIdx
                      const itemId = `fci-svc-search-item-${service.id}-${idx}`
                      return result.kind === 'tab' ? (
                        <div
                          key={result.slug}
                          id={itemId}
                          role="option"
                          aria-selected={isHighlighted}
                          className={`fci-dd-item fci-search-result${isHighlighted ? ' fci-dd-item-active' : ''}`}
                          onMouseDown={() => activateResult(service.id, result)}
                          onMouseEnter={() => setHighlightIdx(idx)}
                        >
                          <span className="fci-search-kind fci-kind-tab">tab</span>
                          {result.label}
                        </div>
                      ) : (
                        <div
                          key={result.label}
                          id={itemId}
                          role="option"
                          aria-selected={isHighlighted}
                          className={`fci-dd-item fci-search-result${result.danger ? ' fci-dd-item-danger' : ''}${isHighlighted ? ' fci-dd-item-active' : ''}`}
                          onMouseDown={() => activateResult(service.id, result)}
                          onMouseEnter={() => setHighlightIdx(idx)}
                        >
                          <span className="fci-search-kind fci-kind-action">action</span>
                          {result.label}
                        </div>
                      )
                    })
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
