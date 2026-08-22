import { useDatabaseMetrics } from '@/features/database/hooks'
import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'
import type { ServiceRow } from '@/features/dashboard/serviceCatalog'
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
    <div className="fci-row-actions">
      {/* Live CPU/Memory usage */}
      <DatabaseUsageCell databaseId={row.id} />
      {/* Connect */}
      <button
        type="button"
        className="fci-row-btn fci-btn-connect"
        title="Connect"
        onClick={() => {
          setSelectedRowId(row.id)
          setDeleteError(null)
          setModalAction('db-connect')
        }}
      >
        &#x25BA;
      </button>
      {/* Delete */}
      <button
        type="button"
        className="fci-row-btn fci-btn-delete"
        title="Delete database"
        onClick={() => {
          setSelectedRowId(row.id)
          setDeleteError(null)
          setModalAction('db-delete')
        }}
      >
        ✕
      </button>
    </div>
  )
}
