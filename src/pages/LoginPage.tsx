import { useContext, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from 'react-oidc-context'
import { isOidcConfigured } from '@/lib/oidc'
import { useThemeStore } from '@/store/themeStore'
import './tui-dashboard.css'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const theme = useThemeStore((state) => state.theme)
  const auth = useContext(AuthContext)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth?.isAuthenticated) {
      const state = auth.user?.state as LocationState | undefined
      navigate(state?.from ?? '/dashboard', { replace: true })
    }
  }, [auth?.isAuthenticated, auth?.user, navigate])

  if (!isOidcConfigured() || !auth) {
    return <Navigate to="/" replace />
  }

  const locationState = location.state as LocationState | undefined

  return (
    <div className="fci-page" data-theme={theme}>
      <div className="fci-login-screen">
        <div className="fci-box fci-panel-titled fci-login-panel">
          <span className="fci-box-label">FREE CLOUD INITIATIVE</span>
          <h1 className="fci-login-title">Free Cloud Initiative</h1>
          {auth.isLoading ? (
            <span className="fci-blink">[ AUTHENTICATING... ]</span>
          ) : (
            <button
              type="button"
              className="fci-modal-btn fci-login-btn"
              onClick={() => auth.signinRedirect({ state: { from: locationState?.from } })}
            >
              [ Sign in with Authentik ]
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
