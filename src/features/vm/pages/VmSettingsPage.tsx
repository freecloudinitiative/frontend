export function VmSettingsPage() {
  return (
    <div className="fci-detail-panel" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
        Settings
      </div>
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
