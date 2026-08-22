import type { ServiceRow } from '@/features/dashboard/serviceCatalog'
import type { ModalAction } from '@/features/dashboard/constants'

interface IamRowActionsProps {
  row: ServiceRow
  setSelectedRowId: (id: string) => void
  setIamActionError: (error: string | null) => void
  setModalAction: (action: ModalAction) => void
}

export function IamRowActions({ row, setSelectedRowId, setIamActionError, setModalAction }: IamRowActionsProps) {
  return (
    <div className="fci-row-actions">
      {/* Delete */}
      <button
        type="button"
        className="fci-row-btn fci-btn-delete"
        title="Delete user"
        onClick={() => {
          setSelectedRowId(row.id)
          setIamActionError(null)
          setModalAction('iam-delete')
        }}
      >
        ✕
      </button>
    </div>
  )
}
