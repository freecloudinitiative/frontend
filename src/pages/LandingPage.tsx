import { useContext } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthContext } from 'react-oidc-context'
import { useThemeStore } from '@/store/themeStore'
import './tui-dashboard.css'

const PERKS = [
  '99.9% uptime*  (*measured between power outages in the garage)',
  'Enterprise-grade Kubernetes running on hardware you can hold in one hand',
  'No VC funding. No shareholders. No "growth hacking." Just a guy and some Pis.',
  'SLA: We will fix it once someone notices and complains loudly enough',
  'Carbon footprint: smaller than your laptop charger',
]

export function LandingPage() {
  const theme = useThemeStore((state) => state.theme)
  const navigate = useNavigate()
  const auth = useContext(AuthContext)

  if (auth?.isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="fci-page" data-theme={theme} style={{ overflowY: 'auto' }}>
      <div
        style={{
          margin: 'auto',
          width: '100%',
          maxWidth: '1100px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div className="fci-plain-banner" style={{ margin: '8px auto 24px auto' }}>
          <span className="fci-banner-bracket">[</span>
          FREE CLOUD INITIATIVE
          <span className="fci-banner-bracket">]</span>
        </div>

        <div className="fci-split-layout" style={{ alignItems: 'stretch' }}>
          <div
            className="fci-split-fields"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '18px',
              flex: '0 0 45%',
            }}
          >
            <div
              className="fci-box fci-panel-titled"
              style={{ padding: '28px 26px', textAlign: 'center', width: '100%', maxWidth: '360px' }}
            >
              <span className="fci-box-label">[ ACCESS_TERMINAL ]</span>
              <p style={{ color: 'var(--dash-text-dim)', fontSize: '12px', margin: '0 0 18px 0', lineHeight: 1.6 }}>
                Your cloud console is behind this door. The door is Authentik. The door is friendly.
              </p>
              <button
                type="button"
                className="fci-btn fci-btn-primary"
                style={{ padding: '10px 22px', fontSize: '13px' }}
                onClick={() => navigate('/login')}
              >
                [ ENTER / LOGIN ]
              </button>
            </div>
          </div>

          <div className="fci-split-info" style={{ flex: '1 1 0' }}>
            <h3>What even is this?</h3>
            <p>
              Free Cloud Initiative is a fully self-hosted, definitely-not-enterprise cloud platform running on a
              stack of Raspberry Pis that were originally bought for "a fun weekend project."
            </p>
            <p>
              Compute, storage, IAM, an API gateway — the whole nine yards — held together by ArgoCD, good
              intentions, and someone checking Grafana at 2am.
            </p>

            <h3>Why should I trust it?</h3>
            <div className="fci-box" style={{ padding: '12px 14px', marginBottom: '12px' }}>
              {PERKS.map((perk) => (
                <div
                  key={perk}
                  style={{
                    fontSize: '12px',
                    color: 'var(--dash-text-dim)',
                    lineHeight: 1.7,
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: 'var(--dash-accent)' }}>»</span>
                  <span>{perk}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--dash-text-dim)' }}>
              No credit card required, mostly because we have no idea how to charge one.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
