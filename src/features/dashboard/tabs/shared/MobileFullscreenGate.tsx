import type { ReactNode } from 'react'

interface MobileFullscreenGateProps {
  icon: string
  title: string
  subtitle: string
  tag: string
  ariaLabel: string
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  blurredContent: ReactNode
  fullscreenContent: ReactNode
}

/**
 * Mobile "blurred gate → fullscreen modal" scaffolding shared by the
 * Compute Engine console and Database SQL editor tabs.
 */
export function MobileFullscreenGate({
  icon,
  title,
  subtitle,
  tag,
  ariaLabel,
  isOpen,
  onOpen,
  onClose,
  blurredContent,
  fullscreenContent,
}: MobileFullscreenGateProps) {
  return (
    <>
      <div className="fci-mobile-blurred-gate">
        <div className="fci-mobile-blurred-content">{!isOpen && blurredContent}</div>
        <div className="fci-mobile-connect-gate">
          <div className="fci-mobile-gate-icon">{icon}</div>
          <div className="fci-mobile-gate-title">{title}</div>
          <div className="fci-mobile-gate-subtitle">{subtitle}</div>
          <button type="button" className="fci-linkbtn fci-mobile-connect-btn" onClick={onOpen}>
            ▶ Connect
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fci-mobile-fullscreen-modal" role="dialog" aria-modal="true" aria-label={ariaLabel}>
          <div className="fci-mobile-modal-header">
            <span className="fci-mobile-terminal-tag">{tag}</span>
            <button
              type="button"
              className="fci-linkbtn fci-action-delete fci-mobile-terminal-exit"
              onClick={onClose}
              aria-label="Exit full screen mode"
            >
              ✕ Exit
            </button>
          </div>
          <div className="fci-mobile-modal-body">{fullscreenContent}</div>
        </div>
      )}
    </>
  )
}
