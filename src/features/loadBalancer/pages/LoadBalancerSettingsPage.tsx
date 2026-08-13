interface LoadBalancerSettingsPageProps {
  onBack: () => void
}

const PLANNED_FEATURES = [
  'Target group management',
  'Health check configuration',
  'Listener & routing rules',
  'SSL/TLS certificate binding',
]

export function LoadBalancerSettingsPage({ onBack }: LoadBalancerSettingsPageProps) {
  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Load Balancer Settings</div>
      <button
        type="button"
        className="fci-linkbtn fci-action-back fci-box-key-top"
        onClick={onBack}
        aria-label="Back"
        title="Back"
      >
        &lt;&lt;
      </button>

      <div
        style={{
          textAlign: 'center',
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '220px',
        }}
      >
        <div
          className="fci-blink"
          style={{
            fontSize: 20,
            color: 'var(--dash-accent)',
            marginBottom: 14,
            letterSpacing: '0.1em',
            fontWeight: 600,
          }}
        >
          [ COMING SOON ]
        </div>
        <div
          style={{
            color: 'var(--dash-text-dim)',
            fontSize: 13,
            maxWidth: 480,
            margin: '0 auto 18px',
            lineHeight: 1.6,
          }}
        >
          Load Balancer settings are under active development for Free Cloud Initiative.
        </div>
        <ul style={{ textAlign: 'left', fontSize: 13, color: 'var(--dash-text-dim)', lineHeight: 1.8 }}>
          {PLANNED_FEATURES.map((feature) => (
            <li key={feature}>» {feature}</li>
          ))}
        </ul>
        <button type="button" className="fci-btn fci-btn-secondary" style={{ marginTop: 20 }} onClick={onBack}>
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
