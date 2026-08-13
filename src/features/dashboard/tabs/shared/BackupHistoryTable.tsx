import { DASH_COLORS } from '@/lib/theme'
import { MetricRow } from './MetricRow'

const BACKUPS = [
  { id: 'bkp-001', timestamp: '2026-08-10 02:00 UTC', size: '18.4 GB', status: '✓ Complete', color: DASH_COLORS.green },
  { id: 'bkp-002', timestamp: '2026-08-09 02:00 UTC', size: '17.9 GB', status: '✓ Complete', color: DASH_COLORS.green },
  { id: 'bkp-003', timestamp: '2026-08-08 02:00 UTC', size: '17.1 GB', status: '⚠ Partial', color: DASH_COLORS.amber },
  { id: 'bkp-004', timestamp: '2026-08-07 02:00 UTC', size: '16.8 GB', status: '✓ Complete', color: DASH_COLORS.green },
]

/**
 * Backups tab content shared between Compute Engine and Database — both
 * services surface the same mock backup history and retention policy.
 */
export function BackupHistoryTable() {
  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Backup History</div>
      <table className="fci-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Timestamp</th>
            <th>Size</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {BACKUPS.map((backup) => (
            <tr key={backup.id}>
              <td style={{ color: DASH_COLORS.label }}>{backup.id}</td>
              <td style={{ color: DASH_COLORS.dim }}>{backup.timestamp}</td>
              <td>{backup.size}</td>
              <td style={{ color: backup.color }}>{backup.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <MetricRow
        title="Policy"
        items={[
          { label: 'Schedule', value: 'Daily 02:00 UTC', color: DASH_COLORS.label },
          { label: 'Retention', value: '30 days', color: DASH_COLORS.label },
          { label: 'Encryption', value: 'AES-256', color: DASH_COLORS.green },
          { label: 'Next run', value: 'in 14h 00m', color: DASH_COLORS.amber },
        ]}
      />
    </div>
  )
}
