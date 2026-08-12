import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'
import type { ServiceRow } from '@/lib/mockServiceData'
import type { ModalAction } from '@/features/dashboard/constants'

const STORAGE_MAX_BYTES = 1024 ** 4

function BucketUsageCell({ totalSize }: { totalSize: number }) {
  const usagePct = Math.min(100, Math.round((totalSize / STORAGE_MAX_BYTES) * 100))

  return (
    <div className="fci-usage-cell">
      <AsciiProgressBar label="S" value={usagePct} width={10} />
    </div>
  )
}

interface StorageRowActionsProps {
  row: ServiceRow
  totalSize: number
  setSelectedRowId: (id: string) => void
  setDeleteError: (error: string | null) => void
  setModalAction: (action: ModalAction) => void
}

export function StorageRowActions({ row, totalSize, setSelectedRowId, setDeleteError, setModalAction }: StorageRowActionsProps) {
  return (
    <div className="fci-vm-actions">
      {/* Live storage occupancy */}
      <BucketUsageCell totalSize={totalSize} />
      {/* Add File */}
      <button
        type="button"
        title="Add file"
        onClick={() => {
          setSelectedRowId(row.id)
          setModalAction('storage-upload')
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
        +
      </button>
      {/* Delete */}
      <button
        type="button"
        title="Delete bucket"
        onClick={() => {
          setSelectedRowId(row.id)
          setDeleteError(null)
          setModalAction('storage-delete')
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
