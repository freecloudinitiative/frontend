import { useSmartBack } from '@/hooks/useSmartBack'
import './tui-dashboard.css'

export function NotFoundPage() {
  const goBack = useSmartBack('/dashboard')

  return (
    <div className="fci-page">
      <div className="fci-status-screen">
        <div className="fci-status-box">
          <span className="fci-box-label">404</span>
          <h1 className="fci-status-title">RESOURCE NOT FOUND</h1>
          <p className="fci-status-message">
            The requested path does not exist in this terminal.
          </p>
          <button
            type="button"
            className="fci-modal-btn fci-status-btn"
            onClick={goBack}
          >
            [ Return to Dashboard ]
          </button>
        </div>
      </div>
    </div>
  )
}
