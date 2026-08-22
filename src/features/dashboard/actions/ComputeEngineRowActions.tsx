import { useComputeEngineMetrics } from '@/features/computeEngine/hooks'
import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'
import type { ServiceRow } from '@/features/dashboard/serviceCatalog'
import type { ModalAction } from '@/features/dashboard/constants'

function ComputeEngineUsageCell({ computeEngineId }: { computeEngineId: string }) {
  const { data: metrics } = useComputeEngineMetrics(computeEngineId, '30m', { refetchInterval: 5000 })
  const latest = metrics?.[metrics.length - 1]

  return (
    <div className="fci-usage-cell">
      <AsciiProgressBar label="C" value={latest?.cpu ?? 0} width={10} />
      <AsciiProgressBar label="M" value={latest?.memory ?? 0} width={10} />
    </div>
  )
}

interface ComputeEngineRowActionsProps {
  row: ServiceRow
  setSelectedRowId: (id: string) => void
  setModalAction: (action: ModalAction) => void
}

export function ComputeEngineRowActions({ row, setSelectedRowId, setModalAction }: ComputeEngineRowActionsProps) {
  return (
    <div className="fci-row-actions">
      {/* Live CPU/Memory usage */}
      <ComputeEngineUsageCell computeEngineId={row.id} />
      {/* Connect / Terminal */}
      <button
        type="button"
        className="fci-row-btn fci-btn-connect"
        title="Connect via terminal"
        onClick={() => {
          window.open(`/console/${encodeURIComponent(row.name)}`, '_blank', 'noopener,noreferrer')
        }}
      >
        &#x25BA;
      </button>
      {/* Delete */}
      <button
        type="button"
        className="fci-row-btn fci-btn-delete"
        title="Delete Compute Engine"
        onClick={() => {
          setSelectedRowId(row.id)
          setModalAction('delete')
        }}
      >
        ✕
      </button>
    </div>
  )
}
