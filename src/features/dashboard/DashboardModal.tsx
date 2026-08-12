import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useThemeStore } from '@/store/themeStore'

interface DashboardModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function DashboardModal({ isOpen, onClose, title, children }: DashboardModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const theme = useThemeStore((state) => state.theme)
  const titleId = useId()

  // Capture invoking element when opening and restore focus on close (or fallback to stable list control)
  useEffect(() => {
    if (!isOpen) return
    const prevEl = document.activeElement as HTMLElement | null

    return () => {
      if (prevEl && document.body.contains(prevEl)) {
        prevEl.focus()
      } else {
        const fallback =
          document.getElementById('btn-action-refresh') ??
          document.getElementById('btn-action-add')
        fallback?.focus()
      }
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Trap focus inside the modal
  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current
    if (!dialog) return

    // Focus the first focusable element
    const initialFocusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    initialFocusable[0]?.focus()

    function trapFocus(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialog) return
      // Re-query focusable elements dynamically in case content changes
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) { e.preventDefault(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', trapFocus)
    return () => document.removeEventListener('keydown', trapFocus)
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fci-modal-overlay"
      data-theme={theme}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="fci-modal-box" ref={dialogRef}>
        <div className="fci-modal-header">
          <span id={titleId} className="fci-modal-title">{title}</span>
          <button
            type="button"
            className="fci-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="fci-modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
