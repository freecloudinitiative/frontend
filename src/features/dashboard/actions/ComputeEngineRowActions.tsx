import { useComputeEngineMetrics } from '@/features/computeEngine/hooks'
import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'
import type { ServiceRow } from '@/features/dashboard/serviceCatalog'
import type { ModalAction } from '@/features/dashboard/constants'

function ComputeEngineUsageCell({ computeEngineId, enabled }: { computeEngineId: string; enabled: boolean }) {
  const { data: metrics } = useComputeEngineMetrics(enabled ? computeEngineId : undefined, '30m', { refetchInterval: 5000 })
  const latest = metrics?.[metrics.length - 1]

  return (
    <div className="fci-usage-cell">
      <AsciiProgressBar label="C" value={latest?.cpu ?? 0} width={10} percentagePrefix />
      <AsciiProgressBar label="M" value={latest?.memory ?? 0} width={10} percentagePrefix />
    </div>
  )
}

interface ComputeEngineRowActionsProps {
  row: ServiceRow
  setSelectedRowId: (id: string) => void
  setModalAction: (action: ModalAction) => void
}

export function ComputeEngineRowActions({ row, setSelectedRowId, setModalAction }: ComputeEngineRowActionsProps) {
  const canConnect = row.status === 'Running'

  return (
    <div className="fci-row-actions">
      {/* Live CPU/Memory usage */}
      <ComputeEngineUsageCell computeEngineId={row.id} enabled={canConnect} />
      {/* Connect / Terminal */}
      <button
        type="button"
        className="fci-row-btn fci-btn-connect"
        title={canConnect ? 'Connect via terminal' : 'Console is available only while the instance is running'}
        disabled={!canConnect}
        onClick={() => {
          const query = new URLSearchParams({ name: row.name })
          window.open(`/console/${encodeURIComponent(row.id)}?${query.toString()}`, '_blank', 'noopener,noreferrer')
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
