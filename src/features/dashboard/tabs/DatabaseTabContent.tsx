import { lazy, Suspense, useState } from 'react'
import type { RoutedTab } from '@/features/dashboard/constants'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { SqlEditorSection } from '@/features/database/sections/SqlEditorSection'
import { DataImportSection } from '@/features/database/sections/DataImportSection'
import { useIsMobile } from '@/hooks/useIsMobile'

const DatabaseMetricsTab = lazy(() => import('./DatabaseMetricsTab').then((m) => ({ default: m.DatabaseMetricsTab })))

interface DatabaseTabContentProps {
  tab: RoutedTab
  selectedDatabaseId: string | null
  databaseName?: string
  maxConnections?: number
}

export function DatabaseTabContent({ tab, selectedDatabaseId, databaseName, maxConnections }: DatabaseTabContentProps) {
  const dim = 'var(--dash-text-dim)'
  const label = 'var(--dash-label)'
  const green = '#7ec87e'
  const amber = '#e8c07d'
  const red = '#e0546a'

  const isMobile = useIsMobile()
  const [fullscreenSql, setFullscreenSql] = useState(false)

  // ── Connections ───────────────────────────────────────────────────────────
  if (tab === 'connections') {
    return (
      <div className="fci-tab-content">
        {/* TODO: there is no dedicated /api/databases/:id/connections endpoint yet —
            this table is static demo data, not wired to live per-connection state. */}
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

  // ── Backups (shared with Compute Engine) ────────────────────────────────────
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
      <Suspense fallback={<div className="fci-tab-content"><DashboardLoading label="LOADING METRICS..." /></div>}>
        <DatabaseMetricsTab selectedDatabaseId={selectedDatabaseId} maxConnections={maxConnections} dim={dim} />
      </Suspense>
    )
  }

  // ── SQL Editor ────────────────────────────────────────────────────────────
  if (tab === 'sql-editor') {
    return isMobile ? (
      <>
        <div className="fci-mobile-blurred-gate">
          <div className="fci-mobile-blurred-content">
            {!fullscreenSql && <SqlEditorSection selectedDatabaseId={selectedDatabaseId} />}
          </div>
          <div className="fci-mobile-connect-gate">
            <div className="fci-mobile-gate-icon">⚡</div>
            <div className="fci-mobile-gate-title">Database Query Editor</div>
            <div className="fci-mobile-gate-subtitle">
              Tap Connect to launch full-screen query environment
            </div>
            <button
              type="button"
              className="fci-linkbtn fci-mobile-connect-btn"
              onClick={() => setFullscreenSql(true)}
            >
              ▶ Connect
            </button>
          </div>
        </div>

        {fullscreenSql && (
          <div
            className="fci-mobile-fullscreen-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Full-screen SQL editor for ${databaseName ?? 'Database'}`}
          >
            <div className="fci-mobile-modal-header">
              <span className="fci-mobile-terminal-tag">SQL Editor — {databaseName ?? 'Database'}</span>
              <button
                type="button"
                className="fci-linkbtn fci-action-delete fci-mobile-terminal-exit"
                onClick={() => setFullscreenSql(false)}
                aria-label="Exit full screen mode"
              >
                ✕ Exit
              </button>
            </div>
            <div className="fci-mobile-modal-body">
              <SqlEditorSection selectedDatabaseId={selectedDatabaseId} />
            </div>
          </div>
        )}
      </>
    ) : (
      <SqlEditorSection selectedDatabaseId={selectedDatabaseId} />
    )
  }

  // ── Data Import ───────────────────────────────────────────────────────────
  if (tab === 'data-import') {
    return <DataImportSection selectedDatabaseId={selectedDatabaseId} />
  }

  return null
}

