import { SERVICES, type ServiceId } from '@/features/dashboard/serviceCatalog'
import type { ThemeId } from '@/store/themeStore'
import type { RegionFilter } from '@/store/regionStore'
import { SERVICE_ICONS } from '@/features/dashboard/icons'
import { RegionSelector } from '@/features/dashboard/RegionSelector'
import { ProfileMenu } from '@/features/dashboard/ProfileMenu'

interface ServiceSearchGridProps {
  activeService: ServiceId
  isMobile: boolean
  isCompact: boolean
  selectService: (id: ServiceId) => void
  setSelectedRowId: (id: string | null) => void
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
  selectService,
  setSelectedRowId,
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
