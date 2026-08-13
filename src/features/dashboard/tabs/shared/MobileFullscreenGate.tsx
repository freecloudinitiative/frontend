import { useEffect, useRef, type ReactNode } from 'react'

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
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement | null
    if (modalRef.current) {
      modalRef.current.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return

        const first = focusables[0]
        const last = focusables[focusables.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === modalRef.current) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, onClose])

  return (
    <>
      <div className="fci-mobile-blurred-gate" aria-hidden={isOpen ? true : undefined}>
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
        <div
          ref={modalRef}
          tabIndex={-1}
          className="fci-mobile-fullscreen-modal"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          style={{ outline: 'none' }}
        >
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
