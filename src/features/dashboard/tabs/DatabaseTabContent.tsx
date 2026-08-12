import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RoutedTab } from '@/features/dashboard/constants'
import { useDatabaseMetrics } from '@/features/database/hooks'
import { SqlEditorSection } from '@/features/database/sections/SqlEditorSection'
import { DataImportSection } from '@/features/database/sections/DataImportSection'
import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

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
    return <DatabaseMetricsTab selectedDatabaseId={selectedDatabaseId} maxConnections={maxConnections} dim={dim} />
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

function formatTimeLabel(timestamp: string) {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function MetricChart({
  title,
  color,
  data,
}: {
  title: string
  color: string
  data: { time: string; value: number }[]
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div className="fci-section-title">{title}</div>
      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="var(--dash-border-subtle)" strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke="var(--dash-text-dim)" tick={{ fill: 'var(--dash-text-dim)', fontSize: 11 }} />
            <YAxis
              stroke="var(--dash-text-dim)"
              tick={{ fill: 'var(--dash-text-dim)', fontSize: 11 }}
              width={40}
            />
            <Tooltip
              contentStyle={{ background: '#0a0a0a', border: '1px solid var(--dash-border-subtle)' }}
              labelStyle={{ color: 'var(--dash-text)' }}
            />
            <Line type="monotone" dataKey="value" name={title} stroke={color} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function DatabaseMetricsTab({
  selectedDatabaseId,
  maxConnections,
  dim,
}: {
  selectedDatabaseId: string | null
  maxConnections?: number
  dim: string
}) {
  const { data: metrics, isLoading, isError, refetch } = useDatabaseMetrics(selectedDatabaseId ?? undefined)

  if (!selectedDatabaseId) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        <div style={{ color: dim }}>Select a database to view metrics</div>
      </div>
    )
  }

  if (isError && !metrics) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        <div style={{ color: 'var(--dash-status-down)', marginTop: 14 }}>
          ⚠️ Failed to load metrics.{' '}
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              background: 'transparent',
              border: '1px solid var(--dash-border-subtle)',
              color: 'var(--dash-text)',
              padding: '2px 8px',
              borderRadius: '2px',
              cursor: 'pointer',
              marginLeft: '6px',
              fontSize: '11px',
            }}
          >
            ↻ Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !metrics || metrics.length === 0) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        <div className="fci-blink" style={{ color: dim, marginTop: 14 }}>⏳ Loading metrics…</div>
      </div>
    )
  }

  const latest = metrics[metrics.length - 1]
  const connectionsPct = maxConnections ? Math.round((latest.connections / maxConnections) * 100) : 0

  const connectionsData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.connections }))
  const qpsData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.queriesPerSecond }))
  const diskIoData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.diskIO }))

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Metrics</div>
      <AsciiProgressBar label="CPU" value={latest.cpuUsage} width={20} />
      <AsciiProgressBar label="Mem" value={latest.memoryUsage} width={20} />
      <AsciiProgressBar label="Conn" value={connectionsPct} width={20} />
      <MetricChart title="Connections" color="#4fa8dc" data={connectionsData} />
      <MetricChart title="Queries/sec" color="#e8c07d" data={qpsData} />
      <MetricChart title="Disk I/O" color="#7ec87e" data={diskIoData} />
    </div>
  )
}
