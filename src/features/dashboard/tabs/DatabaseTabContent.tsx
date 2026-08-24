import { lazy, Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { RoutedTab } from '@/features/dashboard/constants'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { getDatabaseConnections } from '@/features/database/api'
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
      <DatabaseConnectionsTab
        selectedDatabaseId={selectedDatabaseId}
        maxConnections={maxConnections}
        dim={dim}
        label={label}
        green={green}
        amber={amber}
      />
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

function DatabaseConnectionsTab({ 
  selectedDatabaseId, 
  maxConnections, 
  dim, 
  label, 
  green, 
  amber 
}: { 
  selectedDatabaseId: string | null
  maxConnections?: number
  dim: string
  label: string
  green: string
  amber: string
}) {
  const { data: connections, isLoading, isError } = useQuery({
    queryKey: ['databaseConnections', selectedDatabaseId],
    queryFn: () => getDatabaseConnections(selectedDatabaseId!),
    enabled: !!selectedDatabaseId,
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  if (isLoading) {
    return <div className="fci-tab-content"><DashboardLoading label="LOADING CONNECTIONS..." /></div>
  }
  if (isError) {
    return <div className="fci-tab-content"><div style={{color: amber}}>Failed to load connections.</div></div>
  }

  const active = connections?.filter(c => c.state === 'active').length || 0
  const idle = connections?.filter(c => c.state === 'idle').length || 0
  
  // PostgreSQL state can also be 'idle in transaction', 'idle in transaction (aborted)', 'fastpath function call', 'disabled'
  const waiting = connections?.filter(c => c.state !== 'active' && c.state !== 'idle').length || 0

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Active Connections</div>
      <table className="fci-table">
        <thead><tr><th>Client IP</th><th>DB</th><th>User</th><th>State</th><th>Duration</th></tr></thead>
        <tbody>
          {(!connections || connections.length === 0) ? (
            <tr><td colSpan={5} style={{textAlign: 'center', color: dim}}>No active connections</td></tr>
          ) : (
            connections.map((c, i) => (
              <tr key={i}>
                <td style={{ color: label }}>{c.clientIp}</td>
                <td>{c.database}</td>
                <td>{c.user}</td>
                <td style={{ color: c.state === 'active' ? amber : green }}>{c.state}</td>
                <td>{c.duration}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <MetricRow
        title="Pool Stats"
        items={[
          { label: 'Max conn', value: String(maxConnections ?? '-'), color: label },
          { label: 'Active', value: String(active), color: amber },
          { label: 'Idle', value: String(idle), color: green },
          { label: 'Waiting', value: String(waiting), color: green },
        ]}
      />
    </div>
  )
}
