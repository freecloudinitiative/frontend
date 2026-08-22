import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'
import type { ServiceRow } from '@/features/dashboard/serviceCatalog'
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
    <div className="fci-row-actions">
      {/* Live storage occupancy */}
      <BucketUsageCell totalSize={totalSize} />
      {/* Add File */}
      <button
        type="button"
        className="fci-row-btn fci-btn-connect"
        title="Add file"
        onClick={() => {
          setSelectedRowId(row.id)
          setModalAction('storage-upload')
        }}
      >
        +
      </button>
      {/* Delete */}
      <button
        type="button"
        className="fci-row-btn fci-btn-delete"
        title="Delete bucket"
        onClick={() => {
          setSelectedRowId(row.id)
          setDeleteError(null)
          setModalAction('storage-delete')
        }}
      >
        ✕
      </button>
    </div>
  )
}
