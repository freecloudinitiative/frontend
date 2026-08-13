import type { ServiceRow } from '@/lib/mockServiceData'
import type { ModalAction } from '@/features/dashboard/constants'

interface NetworkRowActionsProps {
  row: ServiceRow
  setSelectedRowId: (id: string) => void
  setDeleteError: (error: string | null) => void
  setModalAction: (action: ModalAction) => void
}

export function NetworkRowActions({ row, setSelectedRowId, setDeleteError, setModalAction }: NetworkRowActionsProps) {
  return (
    <div className="fci-row-actions">
      {/* Delete */}
      <button
        type="button"
        className="fci-row-btn fci-btn-delete"
        title="Delete network"
        onClick={() => {
          setSelectedRowId(row.id)
          setDeleteError(null)
          setModalAction('network-delete')
        }}
      >
        ✕
      </button>
    </div>
  )
}
