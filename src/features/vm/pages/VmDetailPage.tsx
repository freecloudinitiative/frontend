import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Panel } from '@/components/ui/Panel'
import { QueryState } from '@/components/ui/QueryState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useDeleteVm, useVm } from '@/features/vm/hooks'
import type { Vm } from '@/features/vm/types'

function VmDetailFields({ vm }: { vm: Vm }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      <dt className="text-tui-accent">Status</dt>
      <dd>
        <StatusBadge status={vm.status} />
      </dd>

      <dt className="text-tui-accent">CPU</dt>
      <dd>{vm.cpu} cores</dd>

      <dt className="text-tui-accent">Memory</dt>
      <dd>{vm.memory} GB</dd>

      <dt className="text-tui-accent">Disk</dt>
      <dd>{vm.disk} GB</dd>

      <dt className="text-tui-accent">IP Address</dt>
      <dd>{vm.ipAddress}</dd>

      <dt className="text-tui-accent">Created</dt>
      <dd>{new Date(vm.createdAt).toLocaleString()}</dd>
    </dl>
  )
}

export function VmDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const vmQuery = useVm(id)
  const deleteVm = useDeleteVm()
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleConfirmDelete() {
    if (!id) return
    deleteVm.mutate(id, {
      onSuccess: () => {
        setDeleteOpen(false)
        navigate('/services/vm/details')
      },
    })
  }

  return (
    <div className="p-6">
      <QueryState
        isLoading={vmQuery.isLoading}
        isError={vmQuery.isError}
        data={vmQuery.data}
        emptyMessage="VM not found"
      >
        {(vm) => (
          <Panel title={vm.name}>
            <VmDetailFields vm={vm} />

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => navigate(`/services/vm/${id}/edit`)}>Edit</Button>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
              {/* Restart is intentionally inert: no backend support is planned for it yet. */}
              <Button disabled title="Restart is not supported yet">
                Restart
              </Button>
            </div>

            <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Confirm Delete">
              <p>Are you sure you want to delete {vm.name}?</p>

              {deleteVm.isError && (
                <p className="mt-2 text-tui-stopped">
                  {deleteVm.error instanceof Error ? deleteVm.error.message : 'Failed to delete VM'}
                </p>
              )}

              <div className="mt-4 flex gap-3">
                <Button variant="danger" disabled={deleteVm.isPending} onClick={handleConfirmDelete}>
                  {deleteVm.isPending ? 'Deleting…' : 'Delete'}
                </Button>
                <Button disabled={deleteVm.isPending} onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
              </div>
            </Modal>
          </Panel>
        )}
      </QueryState>
    </div>
  )
}
