import type { ThemeId } from '@/store/themeStore'

interface ProfileMenuProps {
  profileOpen: boolean
  setProfileOpen: (open: boolean) => void
  toggleProfile: (event?: React.MouseEvent) => void
  isMobile: boolean
  isCompact: boolean
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  handleSignOut: (event: React.MouseEvent) => void
  /** Desktop shows a "(p)" keyboard-shortcut hint; mobile has no physical keyboard, so omits it. */
  showKeyHint: boolean
}

export function ProfileMenu({
  profileOpen,
  setProfileOpen,
  toggleProfile,
  isMobile,
  isCompact,
  theme,
  setTheme,
  handleSignOut,
  showKeyHint,
}: ProfileMenuProps) {
  return (
    <div
      className={`fci-box fci-profile fci-dropdown${profileOpen ? ' fci-open' : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={profileOpen}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (!target.closest('.fci-dd-menu')) {
          toggleProfile(e)
        }
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !(e.target as HTMLElement).closest('.fci-dd-menu')) {
          e.preventDefault()
          toggleProfile()
        }
      }}
    >
      <div className="fci-box-label">Profile</div>
      <span className="fci-profile-icon">&#9786;</span>
      <span className="fci-profile-name">root@HEAD</span>
      <div className="fci-dd-arrow">&#9660;</div>
      {showKeyHint && <div className="fci-box-key">(p)</div>}
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
  )
}
