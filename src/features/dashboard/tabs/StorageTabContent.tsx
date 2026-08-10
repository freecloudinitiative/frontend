import type { RoutedTab } from '@/features/dashboard/constants'

interface StorageTabContentProps {
  tab: RoutedTab
}

export function StorageTabContent({ tab }: StorageTabContentProps) {
  const dim = 'var(--dash-text-dim)'
  const label = 'var(--dash-label)'
  const green = '#7ec87e'
  const amber = '#e8c07d'
  const red = '#e0546a'

  // ── Objects ───────────────────────────────────────────────────────────────
  if (tab === 'objects') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Bucket Contents</div>
        <table className="fci-table">
          <thead><tr><th>Key</th><th>Size</th><th>Modified</th><th>Class</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>backups/db-2026-08-10.sql.gz</td><td>18.4 GB</td><td style={{ color: dim }}>10 Aug 2026</td><td>STANDARD</td></tr>
            <tr><td style={{ color: label }}>logs/app-2026-08-10.log.gz</td><td>342 MB</td><td style={{ color: dim }}>10 Aug 2026</td><td>NEARLINE</td></tr>
            <tr><td style={{ color: label }}>assets/frontend-v1.2.tar.gz</td><td>89 MB</td><td style={{ color: dim }}>08 Aug 2026</td><td>STANDARD</td></tr>
          </tbody>
        </table>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Storage Stats</div>
        <div className="fci-metricrow">
          <div>Total objects: <span style={{ color: label }}>1 482</span></div>
          <div>Total size: <span style={{ color: label }}>842 GB</span></div>
          <div>Versioning: <span style={{ color: green }}>Enabled</span></div>
          <div>Lifecycle: <span style={{ color: green }}>Active</span></div>
        </div>
      </div>
    )
  }

  // ── Access (Storage) ──────────────────────────────────────────────────────
  if (tab === 'access') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">IAM Bindings</div>
        <table className="fci-table">
          <thead><tr><th>Principal</th><th>Role</th><th>Condition</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>serviceAccount:app@proj.iam</td><td>roles/storage.objectViewer</td><td style={{ color: dim }}>—</td></tr>
            <tr><td style={{ color: label }}>user:root@HEAD</td><td>roles/storage.admin</td><td style={{ color: dim }}>—</td></tr>
            <tr><td style={{ color: label }}>allUsers</td><td>roles/storage.objectViewer</td><td style={{ color: amber }}>path prefix: /public/</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── Metrics (Storage) ─────────────────────────────────────────────────────
  if (tab === 'metrics') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">CPU &amp; Memory</div>
        <div className="fci-metricrow">
          <div>CPU avg (1h): <span style={{ color: green }}>32%</span></div>
          <div>CPU peak: <span style={{ color: amber }}>71%</span></div>
          <div>Mem used: <span style={{ color: amber }}>58%</span></div>
          <div>Mem free: <span style={{ color: green }}>42%</span></div>
        </div>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Disk</div>
        <div className="fci-metricrow">
          <div>Read: <span style={{ color: label }}>142 MB/s</span></div>
          <div>Write: <span style={{ color: label }}>89 MB/s</span></div>
          <div>IOPS: <span style={{ color: label }}>4 200</span></div>
          <div>Latency: <span style={{ color: green }}>0.4 ms</span></div>
        </div>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Uptime</div>
        <div className="fci-metricrow">
          <div>SLA: <span style={{ color: green }}>99.98%</span></div>
          <div>Last incident: <span style={{ color: dim }}>14 days ago</span></div>
          <div>Alerts (open): <span style={{ color: red }}>2</span></div>
          <div>Alerts (7d): <span style={{ color: amber }}>5</span></div>
        </div>
      </div>
    )
  }

  return null
}
