import { useDatabaseMetrics } from '@/features/database/hooks'
import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'
import type { ServiceRow } from '@/lib/mockServiceData'
import type { ModalAction } from '@/features/dashboard/constants'

function DatabaseUsageCell({ databaseId }: { databaseId: string }) {
  const { data: metrics } = useDatabaseMetrics(databaseId, { refetchInterval: 5000 })
  const latest = metrics?.[metrics.length - 1]

  return (
    <div className="fci-usage-cell">
      <AsciiProgressBar label="C" value={latest?.cpuUsage ?? 0} width={10} />
      <AsciiProgressBar label="M" value={latest?.memoryUsage ?? 0} width={10} />
    </div>
  )
}

interface DatabaseRowActionsProps {
  row: ServiceRow
  setSelectedRowId: (id: string) => void
  setDeleteError: (error: string | null) => void
  setModalAction: (action: ModalAction) => void
}

export function DatabaseRowActions({ row, setSelectedRowId, setDeleteError, setModalAction }: DatabaseRowActionsProps) {
  return (
    <div className="fci-vm-actions">
      {/* Live CPU/Memory usage */}
      <DatabaseUsageCell databaseId={row.id} />
      {/* Connect */}
      <button
        type="button"
        title="Connect"
        onClick={() => {
          setSelectedRowId(row.id)
          setDeleteError(null)
          setModalAction('db-connect')
        }}
        style={{
          fontSize: '0.7rem',
          padding: '0.15rem 0.45rem',
          background: 'transparent',
          border: '1px solid var(--dash-label)',
          color: 'var(--dash-label)',
          borderRadius: '2px',
          cursor: 'pointer',
          letterSpacing: '0.04em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#7ec87e'
          e.currentTarget.style.color = '#7ec87e'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--dash-label)'
          e.currentTarget.style.color = 'var(--dash-label)'
        }}
      >
        &#x25BA;
      </button>
      {/* Delete */}
      <button
        type="button"
        title="Delete database"
        onClick={() => {
          setSelectedRowId(row.id)
          setDeleteError(null)
          setModalAction('db-delete')
        }}
        style={{
          fontSize: '0.7rem',
          padding: '0.15rem 0.45rem',
          background: 'transparent',
          border: '1px solid #e0546a',
          color: '#e0546a',
          borderRadius: '2px',
          cursor: 'pointer',
          letterSpacing: '0.04em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#e0546a22'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        ✕
      </button>
    </div>
  )
}
