import { lazy, Suspense, useState } from 'react'
import type { RoutedTab } from '@/features/dashboard/constants'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { useIsMobile } from '@/hooks/useIsMobile'
import { DASH_COLORS } from '@/lib/theme'
import { BackupHistoryTable } from './shared/BackupHistoryTable'
import { MetricRow } from './shared/MetricRow'
import { MobileFullscreenGate } from './shared/MobileFullscreenGate'

const DatabaseMetricsTab = lazy(() => import('./DatabaseMetricsTab').then((m) => ({ default: m.DatabaseMetricsTab })))
const SqlEditorSection = lazy(() => import('@/features/database/sections/SqlEditorSection').then((m) => ({ default: m.SqlEditorSection })))
const DataImportSection = lazy(() => import('@/features/database/sections/DataImportSection').then((m) => ({ default: m.DataImportSection })))

interface DatabaseTabContentProps {
  tab: RoutedTab
  selectedDatabaseId: string | null
  databaseName?: string
  maxConnections?: number
}

export function DatabaseTabContent({ tab, selectedDatabaseId, databaseName, maxConnections }: DatabaseTabContentProps) {
  const { dim, label, green, amber } = DASH_COLORS

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
        <MetricRow
          title="Pool Stats"
          items={[
            { label: 'Max conn', value: '200', color: label },
            { label: 'Active', value: '3', color: amber },
            { label: 'Idle', value: '197', color: green },
            { label: 'Waiting', value: '0', color: green },
          ]}
        />
      </div>
    )
  }

  // ── Logs ──────────────────────────────────────────────────────────────────
  if (tab === 'logs') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Recent Log Entries</div>
        <div className="fci-console-log">
          <div className="fci-log-entry">
            <span className="fci-log-timestamp">2026-08-10 10:58:01 UTC</span> <span className="fci-log-badge fci-log-info">[INFO]</span> <span className="fci-log-msg">autovacuum: table "prod_db.public.events" — 0 recs</span>
          </div>
          <div className="fci-log-entry">
            <span className="fci-log-timestamp">2026-08-10 10:57:44 UTC</span> <span className="fci-log-badge fci-log-info">[INFO]</span> <span className="fci-log-msg">checkpoint starting: time</span>
          </div>
          <div className="fci-log-entry">
            <span className="fci-log-timestamp">2026-08-10 10:57:44 UTC</span> <span className="fci-log-badge fci-log-info">[INFO]</span> <span className="fci-log-msg">checkpoint complete: wrote 842 buffers</span>
          </div>
          <div className="fci-log-entry">
            <span className="fci-log-timestamp">2026-08-10 10:55:12 UTC</span> <span className="fci-log-badge fci-log-warn">[WARN]</span> <span className="fci-log-msg">slow query detected (1 843 ms): SELECT * FROM events WHERE ...</span>
          </div>
          <div className="fci-log-entry">
            <span className="fci-log-timestamp">2026-08-10 10:52:01 UTC</span> <span className="fci-log-badge fci-log-error">[ERROR]</span> <span className="fci-log-msg">connection to 10.128.0.99 refused — retrying</span>
          </div>
          <div className="fci-log-entry">
            <span className="fci-log-timestamp">2026-08-10 10:50:33 UTC</span> <span className="fci-log-badge fci-log-info">[INFO]</span> <span className="fci-log-msg">database system is ready to accept connections</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Backups (shared with Compute Engine) ────────────────────────────────────
  if (tab === 'backups') {
    return <BackupHistoryTable />
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
    return (
      <Suspense fallback={<div className="fci-tab-content"><DashboardLoading label="LOADING SQL EDITOR..." /></div>}>
        {isMobile ? (
          <MobileFullscreenGate
            icon="⚡"
            title="Database Query Editor"
            subtitle="Tap Connect to launch full-screen query environment"
            tag={`SQL Editor — ${databaseName ?? 'Database'}`}
            ariaLabel={`Full-screen SQL editor for ${databaseName ?? 'Database'}`}
            isOpen={fullscreenSql}
            onOpen={() => setFullscreenSql(true)}
            onClose={() => setFullscreenSql(false)}
            blurredContent={<SqlEditorSection selectedDatabaseId={selectedDatabaseId} />}
            fullscreenContent={<SqlEditorSection selectedDatabaseId={selectedDatabaseId} />}
          />
        ) : (
          <SqlEditorSection selectedDatabaseId={selectedDatabaseId} />
        )}
      </Suspense>
    )
  }

  // ── Data Import ───────────────────────────────────────────────────────────
  if (tab === 'data-import') {
    return (
      <Suspense fallback={<div className="fci-tab-content"><DashboardLoading label="LOADING IMPORT..." /></div>}>
        <DataImportSection selectedDatabaseId={selectedDatabaseId} />
      </Suspense>
    )
  }

  return null
}
