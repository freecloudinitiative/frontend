interface VmSettingsPageProps {
  onBack: () => void
}

export function VmSettingsPage({ onBack }: VmSettingsPageProps) {
  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Settings</div>
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: '0.75rem',
          color: 'var(--dash-text-dim)',
          padding: '2rem',
          textAlign: 'center',
          marginTop: 14,
        }}
      >
        <span style={{ fontSize: '2rem' }}>⚙️</span>
        <span style={{ fontSize: '1rem', letterSpacing: '0.08em', fontWeight: 600 }}>
          Coming Soon
        </span>
        <span style={{ fontSize: '0.78rem', opacity: 0.6 }}>
          VM settings will be available here soon.
        </span>
      </div>
    </div>
  )
}
