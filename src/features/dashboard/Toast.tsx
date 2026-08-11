import { useEffect } from 'react'
import { useToastStore } from '@/store/toastStore'
import type { Toast } from '@/store/toastStore'

// ── Single toast item ─────────────────────────────────────────────────────────
function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((state) => state.removeToast)

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, removeToast])

  function handleDismiss() {
    removeToast(toast.id)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleDismiss()
    }
  }

  return (
    <div
      className={`fci-toast fci-toast-${toast.type}`}
      role="alert"
      aria-live="assertive"
      tabIndex={0}
      onClick={handleDismiss}
      onKeyDown={handleKeyDown}
      title="Click or press Enter/Space to dismiss"
    >
      <span className="fci-toast-icon">
        {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}
      </span>
      <span className="fci-toast-message">{toast.message}</span>
      <button
        type="button"
        className="fci-toast-close"
        onClick={(e) => {
          e.stopPropagation()
          handleDismiss()
        }}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  )
}

// ── Toast container (fixed position, bottom-right) ────────────────────────────
export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fci-toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
