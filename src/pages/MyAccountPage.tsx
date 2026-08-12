import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from 'react-oidc-context'
import { isOidcConfigured } from '@/lib/oidc'
import { useThemeStore } from '@/store/themeStore'
import './tui-dashboard.css'

const THEME_LABELS: Record<string, string> = {
  beige: 'Beige',
  mono: 'Black & white',
  default: 'Default',
  navy: 'Dark navy',
}

export function MyAccountPage() {
  const navigate = useNavigate()
  const theme = useThemeStore((s) => s.theme)
  const auth = useContext(AuthContext)
  const profile = isOidcConfigured() ? auth?.user?.profile : undefined

  const username = profile?.preferred_username ?? 'root@HEAD'
  const email = profile?.email ?? '—'
  const subject = profile?.sub ?? '—'

  return (
    <div className="fci-page fci-account-page" data-theme={theme}>
      <div className="fci-tui" style={{ width: '100%', maxWidth: 600 }}>
        <button
          type="button"
          className="fci-tui-title fci-tui-title-link"
          onClick={() => navigate('/dashboard')}
        >
          Free Cloud Initiative
        </button>
        <button
          type="button"
          className="fci-tui-back-topright"
          onClick={() => navigate('/dashboard')}
          aria-label="Back to Dashboard"
          title="Back to Dashboard"
        >
          ← Back to Dashboard
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', paddingTop: 10 }}>
          <div className="fci-detail-panel fci-panel-titled fci-account-panel">
            <div className="fci-box-label">My Account</div>
            <dl className="fci-account-grid">
              <dt>Username</dt>
              <dd>{username}</dd>
              <dt>Email</dt>
              <dd>{email}</dd>
              <dt>Subject ID</dt>
              <dd>{subject}</dd>
              <dt>Theme</dt>
              <dd>{THEME_LABELS[theme] ?? theme}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
