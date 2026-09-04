import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { useDatabaseBackups } from '@/features/database/hooks'
import { formatBytes, formatDateTime, formatStatusLabel } from '@/lib/format'
import { DASH_COLORS } from '@/lib/theme'
import { ErrorRetry } from './ErrorRetry'
import { MetricRow } from './MetricRow'

function backupStatusColor(status: string) {
  if (status === 'completed') return DASH_COLORS.green
  if (status === 'failed' || status.includes('error')) return DASH_COLORS.red
  if (['pending', 'started', 'running', 'finalizing'].includes(status)) return DASH_COLORS.amber
  return DASH_COLORS.dim
}

/** Database backup history and effective policy loaded from database-service. */
export function BackupHistoryTable({ selectedDatabaseId }: { selectedDatabaseId: string | null }) {
  const { data, isLoading, isError, refetch } = useDatabaseBackups(selectedDatabaseId ?? undefined)

  if (!selectedDatabaseId) {
    return <div style={{ color: DASH_COLORS.dim }}>[ NO DATABASE SELECTED ]</div>
  }
  if (isError) {
    return <ErrorRetry resourceLabel="backups" onRetry={() => refetch()} />
  }
  if (isLoading || !data) {
    return <DashboardLoading label="LOADING BACKUPS..." />
  }

  const policyItems = data.policy.enabled
    ? [
        { label: 'Schedule', value: data.policy.schedule ? `${data.policy.schedule} (UTC)` : 'Not reported', color: DASH_COLORS.label },
        { label: 'Retention', value: data.policy.retentionDays ? `${data.policy.retentionDays} days` : 'Not reported', color: DASH_COLORS.label },
        { label: 'Encryption', value: data.policy.encryption || 'Not reported', color: data.policy.encryption ? DASH_COLORS.green : DASH_COLORS.dim },
      ]
    : [{ label: 'Status', value: 'Disabled', color: DASH_COLORS.dim }]

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Backup History</div>
      {data.backups.length === 0 ? (
        <div style={{ color: DASH_COLORS.dim }}>No backups exist for this database.</div>
      ) : (
        <table className="fci-table fci-detail-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Size</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.backups.map((backup) => (
              <tr key={backup.id}>
                <td style={{ color: DASH_COLORS.label }} title={backup.id}>{backup.id}</td>
                <td style={{ color: DASH_COLORS.dim }}>{backup.startedAt ? formatDateTime(backup.startedAt) : 'Not reported'}</td>
                <td title={backup.sizeBytes === undefined ? 'Size is not reported by database-service' : undefined}>
                  {backup.sizeBytes === undefined ? 'Not reported' : formatBytes(backup.sizeBytes)}
                </td>
                <td style={{ color: backupStatusColor(backup.status) }} title={backup.error}>
                  {backup.status ? formatStatusLabel(backup.status) : 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <MetricRow title="Policy" items={policyItems} />
    </div>
  )
}
