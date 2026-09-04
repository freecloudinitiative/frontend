import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from 'react-oidc-context'
import { isOidcConfigured } from '@/lib/oidc'
import { isSessionReauthenticationRequired } from '@/lib/sessionActivity'
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
  const redirectStarted = useRef(false)
  const [redirectError, setRedirectError] = useState(false)
  const locationState = location.state as LocationState | undefined
  const forceReauthentication =
    new URLSearchParams(location.search).get('reauth') === '1' || isSessionReauthenticationRequired()

  const beginSignin = useCallback(() => {
    if (!auth || redirectStarted.current) return

    redirectStarted.current = true
    setRedirectError(false)
    void auth.signinRedirect({
      state: { from: locationState?.from },
      ...(forceReauthentication ? { prompt: 'login' as const, max_age: 0 } : {}),
    }).catch(() => {
      redirectStarted.current = false
      setRedirectError(true)
    })
  }, [auth, forceReauthentication, locationState?.from])

  useEffect(() => {
    if (auth?.isAuthenticated) {
      const state = auth.user?.state as LocationState | undefined
      navigate(state?.from ?? '/dashboard', { replace: true })
    }
  }, [auth?.isAuthenticated, auth?.user, navigate])

  useEffect(() => {
    if (!auth || auth.isLoading || auth.isAuthenticated || auth.activeNavigator || auth.error || redirectError) return
    beginSignin()
  }, [auth, auth?.activeNavigator, auth?.error, auth?.isAuthenticated, auth?.isLoading, beginSignin, redirectError])

  if (!isOidcConfigured() || !auth) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="fci-page" data-theme={theme}>
      <div className="fci-login-screen">
        <div className="fci-box fci-panel-titled fci-login-panel">
          <span className="fci-box-label">FREE CLOUD INITIATIVE</span>
          <h1 className="fci-login-title">Free Cloud Initiative</h1>
          {redirectError || auth.error ? (
            <>
              <span>[ AUTHENTIK UNAVAILABLE ]</span>
              <button type="button" className="fci-modal-btn fci-login-btn" onClick={beginSignin}>
                [ RETRY ]
              </button>
            </>
          ) : (
            <span className="fci-blink">[ CONNECTING TO AUTHENTIK... ]</span>
          )}
        </div>
      </div>
    </div>
  )
}
