import type { RoutedTab } from '@/features/dashboard/constants'

interface DatabaseTabContentProps {
  tab: RoutedTab
}

export function DatabaseTabContent({ tab }: DatabaseTabContentProps) {
  const dim = 'var(--dash-text-dim)'
  const label = 'var(--dash-label)'
  const green = '#7ec87e'
  const amber = '#e8c07d'
  const red = '#e0546a'

  // ── Connections ───────────────────────────────────────────────────────────
  if (tab === 'connections') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Active Connections</div>
        <table className="fci-table">
          <thead><tr><th>Client IP</th><th>DB</th><th>User</th><th>State</th><th>Duration</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>10.128.0.5</td><td>prod_db</td><td>app_user</td><td style={{ color: green }}>idle</td><td>2m 14s</td></tr>
            <tr><td style={{ color: label }}>10.128.0.8</td><td>prod_db</td><td>app_user</td><td style={{ color: amber }}>active</td><td>0m 03s</td></tr>
            <tr><td style={{ color: label }}>10.128.0.11</td><td>analytics</td><td>reader</td><td style={{ color: green }}>idle</td><td>18m 55s</td></tr>
          </tbody>
        </table>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Pool Stats</div>
        <div className="fci-metricrow">
          <div>Max conn: <span style={{ color: label }}>200</span></div>
          <div>Active: <span style={{ color: amber }}>3</span></div>
          <div>Idle: <span style={{ color: green }}>197</span></div>
          <div>Waiting: <span style={{ color: green }}>0</span></div>
        </div>
      </div>
    )
  }

  // ── Logs ──────────────────────────────────────────────────────────────────
  if (tab === 'logs') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Recent Log Entries</div>
        <div className="fci-console-log">
          <span style={{ color: dim }}>2026-08-10 10:58:01 UTC</span> <span style={{ color: green }}>[INFO]</span>  autovacuum: table "prod_db.public.events" — 0 recs<br />
          <span style={{ color: dim }}>2026-08-10 10:57:44 UTC</span> <span style={{ color: green }}>[INFO]</span>  checkpoint starting: time<br />
          <span style={{ color: dim }}>2026-08-10 10:57:44 UTC</span> <span style={{ color: green }}>[INFO]</span>  checkpoint complete: wrote 842 buffers<br />
          <span style={{ color: dim }}>2026-08-10 10:55:12 UTC</span> <span style={{ color: amber }}>[WARN]</span>  slow query detected (1 843 ms): SELECT * FROM events WHERE ...<br />
          <span style={{ color: dim }}>2026-08-10 10:52:01 UTC</span> <span style={{ color: red }}>[ERROR]</span> connection to 10.128.0.99 refused — retrying<br />
          <span style={{ color: dim }}>2026-08-10 10:50:33 UTC</span> <span style={{ color: green }}>[INFO]</span>  database system is ready to accept connections<br />
        </div>
      </div>
    )
  }

  // ── Backups (shared with VM) ───────────────────────────────────────────────
  if (tab === 'backups') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Backup History</div>
        <table className="fci-table">
          <thead><tr><th>ID</th><th>Timestamp</th><th>Size</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>bkp-001</td><td style={{ color: dim }}>2026-08-10 02:00 UTC</td><td>18.4 GB</td><td style={{ color: green }}>✓ Complete</td></tr>
            <tr><td style={{ color: label }}>bkp-002</td><td style={{ color: dim }}>2026-08-09 02:00 UTC</td><td>17.9 GB</td><td style={{ color: green }}>✓ Complete</td></tr>
            <tr><td style={{ color: label }}>bkp-003</td><td style={{ color: dim }}>2026-08-08 02:00 UTC</td><td>17.1 GB</td><td style={{ color: amber }}>⚠ Partial</td></tr>
            <tr><td style={{ color: label }}>bkp-004</td><td style={{ color: dim }}>2026-08-07 02:00 UTC</td><td>16.8 GB</td><td style={{ color: green }}>✓ Complete</td></tr>
          </tbody>
        </table>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Policy</div>
        <div className="fci-metricrow">
          <div>Schedule: <span style={{ color: label }}>Daily 02:00 UTC</span></div>
          <div>Retention: <span style={{ color: label }}>30 days</span></div>
          <div>Encryption: <span style={{ color: green }}>AES-256</span></div>
          <div>Next run: <span style={{ color: amber }}>in 14h 00m</span></div>
        </div>
      </div>
    )
  }

  // ── Metrics ───────────────────────────────────────────────────────────────
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
