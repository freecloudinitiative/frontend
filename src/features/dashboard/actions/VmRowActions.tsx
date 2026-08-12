import { useVmMetrics } from '@/features/vm/hooks'
import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'
import type { ServiceRow } from '@/lib/mockServiceData'
import type { ModalAction } from '@/features/dashboard/constants'

function VmUsageCell({ vmId }: { vmId: string }) {
  const { data: metrics } = useVmMetrics(vmId, '30m', { refetchInterval: 5000 })
  const latest = metrics?.[metrics.length - 1]

  return (
    <div className="fci-usage-cell">
      <AsciiProgressBar label="C" value={latest?.cpu ?? 0} width={10} />
      <AsciiProgressBar label="M" value={latest?.memory ?? 0} width={10} />
    </div>
  )
}

interface VmRowActionsProps {
  row: ServiceRow
  setSelectedRowId: (id: string) => void
  setModalAction: (action: ModalAction) => void
}

export function VmRowActions({ row, setSelectedRowId, setModalAction }: VmRowActionsProps) {
  return (
    <div className="fci-vm-actions">
      {/* Live CPU/Memory usage */}
      <VmUsageCell vmId={row.id} />
      {/* Connect / Terminal */}
      <button
        type="button"
        title="Connect via terminal"
        onClick={() => window.alert(`Connect to ${row.name} (demo)`)}
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
        title="Delete VM"
        onClick={() => {
          setSelectedRowId(row.id)
          setModalAction('delete')
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
