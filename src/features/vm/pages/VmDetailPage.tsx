import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardModal } from '@/features/dashboard/DashboardModal'
import { useDeleteVm, useVm } from '@/features/vm/hooks'
import type { VmStatus } from '@/features/vm/types'
import { useThemeStore } from '@/store/themeStore'
import '../../../pages/tui-dashboard.css'

/** Inline status colour map — mirrors tui-dashboard.css status palette. */
const STATUS_COLORS: Record<VmStatus, string> = {
  running: '#7ec87e',
  stopped: '#e0546a',
  pending: '#e8c07d',
}

export function VmDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useThemeStore((s) => s.theme)
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
    <div className="fci-page" data-theme={theme} style={{ minHeight: '100vh', padding: '24px' }}>
      {/* ── Loading state ── */}
      {vmQuery.isLoading && (
        <p style={{ color: 'var(--dash-text-dim)', fontFamily: 'monospace' }}>
          ⏳ Loading…
        </p>
      )}

      {/* ── Error / not found state ── */}
      {!vmQuery.isLoading && (vmQuery.isError || !vmQuery.data) && (
        <p style={{ color: '#e0546a', fontFamily: 'monospace' }}>
          ✗ VM not found
        </p>
      )}

      {/* ── Detail panel ── */}
      {vmQuery.data && (() => {
        const vm = vmQuery.data
        return (
          <div className="fci-detail-panel fci-panel-titled" style={{ maxWidth: 640 }}>
            {/* Floating panel title */}
            <div className="fci-box-label">{vm.name}</div>

            {/* Back + action buttons in top-right corner */}
            <div className="fci-box-keys-top">
              <button
                type="button"
                className="fci-linkbtn fci-action-back"
                onClick={() => navigate('/services/vm/details')}
                aria-label="Back to VM list"
                title="Back to VM list"
              >
                ← Back
              </button>
              <button
                type="button"
                className="fci-linkbtn fci-action-edit"
                onClick={() => navigate(`/services/vm/${id}/edit`)}
              >
                Edit
              </button>
              <button
                type="button"
                className="fci-linkbtn fci-action-delete"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </button>
              {/* Restart is intentionally inert: no backend support is planned for it yet. */}
              <button
                type="button"
                className="fci-linkbtn"
                disabled
                title="Restart is not supported yet"
                style={{ opacity: 0.4, cursor: 'not-allowed' }}
              >
                Restart
              </button>
            </div>

            {/* Field grid */}
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '6px 20px',
                marginTop: 14,
                color: 'var(--dash-text)',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
              }}
            >
              <dt style={{ color: 'var(--dash-accent)' }}>Status</dt>
              <dd>
                <span style={{ color: STATUS_COLORS[vm.status] }}>
                  [ {vm.status.toUpperCase()} ]
                </span>
              </dd>

              <dt style={{ color: 'var(--dash-accent)' }}>Region</dt>
              <dd>{vm.region}</dd>

              <dt style={{ color: 'var(--dash-accent)' }}>CPU</dt>
              <dd>{vm.cpu} cores</dd>

              <dt style={{ color: 'var(--dash-accent)' }}>Memory</dt>
              <dd>{vm.memory} GB</dd>

              <dt style={{ color: 'var(--dash-accent)' }}>Disk</dt>
              <dd>
                {vm.disk} GB ({vm.diskType})
              </dd>

              <dt style={{ color: 'var(--dash-accent)' }}>OS</dt>
              <dd>{vm.os}</dd>

              <dt style={{ color: 'var(--dash-accent)' }}>IP Address</dt>
              <dd>{vm.ipAddress}</dd>

              <dt style={{ color: 'var(--dash-accent)' }}>Created</dt>
              <dd>{new Date(vm.createdAt).toLocaleString()}</dd>
            </dl>

            {/* Delete confirmation modal */}
            <DashboardModal
              isOpen={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              title="Confirm Delete"
            >
              <p style={{ color: 'var(--dash-text)', fontFamily: 'monospace', marginBottom: 12 }}>
                Are you sure you want to delete <strong>{vm.name}</strong>?
              </p>

              {deleteVm.isError && (
                <p style={{ color: '#e0546a', fontFamily: 'monospace', marginBottom: 12 }}>
                  ✗{' '}
                  {deleteVm.error instanceof Error
                    ? deleteVm.error.message
                    : 'Failed to delete VM'}
                </p>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="fci-linkbtn fci-action-delete"
                  disabled={deleteVm.isPending}
                  onClick={handleConfirmDelete}
                  style={deleteVm.isPending ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                >
                  {deleteVm.isPending ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="fci-linkbtn fci-action-back"
                  disabled={deleteVm.isPending}
                  onClick={() => setDeleteOpen(false)}
                  style={deleteVm.isPending ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                >
                  Cancel
                </button>
              </div>
            </DashboardModal>
          </div>
        )
      })()}
    </div>
  )
}
