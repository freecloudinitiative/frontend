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

const PROJECT_LINKS = [
  {
    label: 'About Creator',
    href: 'https://theomerkaratas.github.io/resume/',
    className: 'fci-pill-creator',
  },
  {
    label: 'Docs',
    href: 'https://freecloudinitiative.github.io/docs/',
    className: 'fci-pill-docs',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/freecloudinitiative',
    className: 'fci-pill-arch',
  },
] as const

export function LandingPage() {
  const theme = useThemeStore((state) => state.theme)
  const navigate = useNavigate()
  const auth = useContext(AuthContext)

  if (auth?.isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="fci-page fci-landing-page" data-theme={theme}>
      <div className="fci-tui fci-landing-shell">
        <div className="fci-landing-content">
          <div className="fci-plain-banner fci-landing-banner">
            <span className="fci-banner-bracket">[</span>
            FREE CLOUD INITIATIVE
            <span className="fci-banner-bracket">]</span>
          </div>

          <div className="fci-split-layout fci-landing-layout">
            <div className="fci-split-fields fci-landing-access">
              <div className="fci-box fci-panel-titled fci-landing-card">
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

            <div className="fci-split-info fci-landing-info">
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

        <nav className="fci-landing-links" aria-label="Project links">
          <span className="fci-box-label">LINKS</span>
          {PROJECT_LINKS.map((link) => (
            <a
              key={link.label}
              className={`fci-landing-link ${link.className}`}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
