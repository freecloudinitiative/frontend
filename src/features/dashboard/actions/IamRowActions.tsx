import type { ServiceRow } from '@/lib/mockServiceData'
import type { ModalAction } from '@/features/dashboard/constants'

interface IamRowActionsProps {
  row: ServiceRow
  setSelectedRowId: (id: string) => void
  setIamActionError: (error: string | null) => void
  setModalAction: (action: ModalAction) => void
}

export function IamRowActions({ row, setSelectedRowId, setIamActionError, setModalAction }: IamRowActionsProps) {
  return (
    <div className="fci-vm-actions">
      {/* Delete */}
      <button
        type="button"
        title="Delete user"
        onClick={() => {
          setSelectedRowId(row.id)
          setIamActionError(null)
          setModalAction('iam-delete')
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
