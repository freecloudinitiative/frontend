import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import './tui-dashboard.css'

export function ErrorPage() {
  const navigate = useNavigate()
  const error = useRouteError()

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.'

  const stack = error instanceof Error ? error.stack : undefined

  return (
    <div className="fci-page">
      <div className="fci-status-screen">
        <div className="fci-status-box fci-status-error">
          <span className="fci-box-label">ERROR</span>
          <h1 className="fci-status-title fci-status-error-title">SYSTEM ERROR</h1>
          <p className="fci-status-message">
            Something went wrong while rendering this view. Try returning to the
            dashboard and reloading.
          </p>
          {import.meta.env.DEV && (
            <div className="fci-console-log fci-status-detail">
              {message}
              {stack ? `\n\n${stack}` : ''}
            </div>
          )}
          <button
            type="button"
            className="fci-modal-btn fci-status-btn"
            onClick={() => navigate('/dashboard')}
          >
            [ Return to Dashboard ]
          </button>
        </div>
      </div>
    </div>
  )
}
