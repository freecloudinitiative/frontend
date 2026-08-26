import { useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Focus the first menuitem when the menu opens
  useEffect(() => {
    if (profileOpen && menuRef.current) {
      const raf = requestAnimationFrame(() => {
        const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"], [role="menuitemradio"]')
        first?.focus()
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [profileOpen])

  const focusMenuitem = useCallback((index: number) => {
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"]')
    items?.[index]?.focus()
  }, [])

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target as HTMLElement).closest('.fci-dd-menu')) {
      e.preventDefault()
      toggleProfile()
    }
    if (e.key === 'ArrowDown' && !profileOpen) {
      e.preventDefault()
      toggleProfile()
    }
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"]')
    if (!items || items.length === 0) return

    const currentIdx = Array.from(items).findIndex((el) => el === document.activeElement)

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        e.stopPropagation()
        const next = currentIdx < items.length - 1 ? currentIdx + 1 : 0
        focusMenuitem(next)
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        e.stopPropagation()
        const prev = currentIdx > 0 ? currentIdx - 1 : items.length - 1
        focusMenuitem(prev)
        break
      }
      case 'Home': {
        e.preventDefault()
        e.stopPropagation()
        focusMenuitem(0)
        break
      }
      case 'End': {
        e.preventDefault()
        e.stopPropagation()
        focusMenuitem(items.length - 1)
        break
      }
      case 'Escape': {
        e.preventDefault()
        e.stopPropagation()
        setProfileOpen(false)
        triggerRef.current?.focus()
        break
      }
    }
  }

  return (
    <div
      ref={triggerRef}
      className={`fci-box fci-profile fci-dropdown${profileOpen ? ' fci-open' : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={profileOpen}
      aria-haspopup="menu"
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (!target.closest('.fci-dd-menu')) {
          toggleProfile(e)
        }
      }}
      onKeyDown={handleTriggerKeyDown}
    >
      <div className="fci-box-label">Profile</div>
      <span className="fci-profile-icon">&#9786;</span>
      <span className="fci-profile-name">root@HEAD</span>
      <div className="fci-dd-arrow">&#9660;</div>
      {showKeyHint && <div className="fci-box-key">(p)</div>}
      <div
        ref={menuRef}
        className="fci-dd-menu"
        role="menu"
        aria-label="Profile menu"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={handleMenuKeyDown}
      >
        <div
          role="menuitem"
          tabIndex={-1}
          className="fci-dd-item"
          onClick={(e) => { e.stopPropagation(); setProfileOpen(false); navigate('/account') }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setProfileOpen(false)
              navigate('/account')
            }
          }}
        >
          My Account
        </div>
        {!isMobile && !isCompact && (
          <div
            role="menuitem"
            tabIndex={-1}
            className="fci-dd-item"
            onClick={(e) => { e.stopPropagation(); setProfileOpen(false); navigate('/about') }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setProfileOpen(false)
                navigate('/about')
              }
            }}
          >
            Manifesto
          </div>
        )}
        <div className="fci-dd-header-label">— Theme —</div>
        <div className="fci-mobile-theme-row" role="group" aria-label="Theme switcher" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          {([
            { id: 'beige', label: 'Beige', bg: '#ece0c8', border: '#9c7a45' },
            { id: 'mono', label: 'Black & white', bg: '#000000', border: '#ffffff' },
            { id: 'default', label: 'Default', bg: '#000000', border: '#3a6ea5' },
            { id: 'navy', label: 'Dark navy', bg: '#0a0e1a', border: '#3a4166' },
            { id: 'sketch', label: 'Pencil Sketch', bg: '#ffffff', border: '#1a1a1a' },
          ] as const).map((swatch) => (
            <button
              key={swatch.id}
              type="button"
              role="menuitemradio"
              tabIndex={-1}
              title={swatch.label}
              aria-label={`${swatch.label} theme`}
              aria-checked={theme === swatch.id}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  setTheme(swatch.id)
                  setProfileOpen(false)
                }
              }}
            />
          ))}
        </div>

        {/* Relocated utility links on mobile and compact screens (max-width: 1450px) */}
        {(isMobile || isCompact) && (
          <>

            <div className="fci-dd-header-label">— Links —</div>
            <a
              href="https://theomerkaratas.github.io/resume/"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              tabIndex={-1}
              className="fci-dd-item fci-dd-link"
              onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              👤 About Creator
            </a>
            <div
              role="menuitem"
              tabIndex={-1}
              className="fci-dd-item fci-dd-link"
              onClick={(e) => { e.stopPropagation(); setProfileOpen(false); navigate('/about'); }}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setProfileOpen(false)
                  navigate('/about')
                }
              }}
            >
              📜 Manifesto
            </div>
            <a
              href="https://freecloudinitiative.github.io/docs/"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              tabIndex={-1}
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
              role="menuitem"
              tabIndex={-1}
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
              role="menuitem"
              tabIndex={-1}
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
              role="menuitem"
              tabIndex={-1}
              className="fci-dd-item fci-dd-link"
              onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              📝 Loki
            </a>
            <div
              role="menuitem"
              tabIndex={-1}
              className="fci-dd-item fci-dd-link"
              style={{ cursor: 'not-allowed', opacity: 0.5 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
            >
              🧪 Chaos Demo
            </div>
            <a
              href="https://architecture.example.com"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              tabIndex={-1}
              className="fci-dd-item fci-dd-link"
              onClick={(e) => { e.stopPropagation(); setProfileOpen(false); }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              🏛 Architecture
            </a>
          </>
        )}
        <div
          role="menuitem"
          tabIndex={-1}
          className="fci-dd-item fci-dd-item-danger"
          style={{ borderTop: '1px solid var(--dash-border-subtle)', marginTop: 4 }}
          onClick={handleSignOut}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleSignOut(e as unknown as React.MouseEvent)
            }
          }}
        >
          Sign out
        </div>
      </div>
    </div>
  )
}
