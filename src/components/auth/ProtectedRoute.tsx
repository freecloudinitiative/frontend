import { useContext } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from 'react-oidc-context'
import { isOidcConfigured } from '@/lib/oidc'
import { useThemeStore } from '@/store/themeStore'
import '@/pages/tui-dashboard.css'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useContext(AuthContext)
  const location = useLocation()
  const theme = useThemeStore((s) => s.theme)

  if (!isOidcConfigured() || !auth) {
    return <>{children}</>
  }

  if (auth.isLoading) {
    return (
      <div className="fci-login-screen" data-theme={theme}>
        <span className="fci-blink">[ AUTHENTICATING... ]</span>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  return <>{children}</>
}
