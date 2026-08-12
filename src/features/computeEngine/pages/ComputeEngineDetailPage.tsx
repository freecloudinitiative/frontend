import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardModal } from '@/features/dashboard/DashboardModal'
import { useComputeEngine, useDeleteComputeEngine } from '@/features/computeEngine/hooks'
import type { ComputeEngineStatus } from '@/features/computeEngine/types'
import { useThemeStore } from '@/store/themeStore'
import '../../../pages/tui-dashboard.css'

/** Inline status colour map — mirrors tui-dashboard.css status palette. */
const STATUS_COLORS: Record<ComputeEngineStatus, string> = {
  running: '#7ec87e',
  stopped: '#e0546a',
  pending: '#e8c07d',
}

export function ComputeEngineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useThemeStore((s) => s.theme)
  const computeEngineQuery = useComputeEngine(id)
  const deleteComputeEngine = useDeleteComputeEngine()
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleConfirmDelete() {
    if (!id) return
    deleteComputeEngine.mutate(id, {
      onSuccess: () => {
        setDeleteOpen(false)
        navigate('/services/compute-engine/details')
      },
    })
  }

  return (
    <div className="fci-page" data-theme={theme} style={{ minHeight: '100vh', padding: '24px' }}>
      {/* ── Loading state ── */}
      {computeEngineQuery.isLoading && (
        <p style={{ color: 'var(--dash-text-dim)', fontFamily: 'monospace' }}>
          ⏳ Loading…
        </p>
      )}

      {/* ── Error / not found state ── */}
      {!computeEngineQuery.isLoading && (computeEngineQuery.isError || !computeEngineQuery.data) && (
        <p style={{ color: '#e0546a', fontFamily: 'monospace' }}>
          ✗ Compute Engine not found
        </p>
      )}

      {/* ── Detail panel ── */}
      {computeEngineQuery.data && (() => {
        const computeEngine = computeEngineQuery.data
        return (
          <div className="fci-detail-panel fci-panel-titled" style={{ maxWidth: 640 }}>
            {/* Floating panel title */}
            <div className="fci-box-label">{computeEngine.name}</div>

            {/* Back + action buttons in top-right corner */}
            <div className="fci-box-keys-top">
              <button
                type="button"
                className="fci-linkbtn fci-action-back"
                onClick={() => navigate('/services/compute-engine/details')}
                aria-label="Back to Compute Engine list"
                title="Back to Compute Engine list"
              >
                ← Back
              </button>
              <button
                type="button"
                className="fci-linkbtn fci-action-edit"
                onClick={() => navigate(`/services/compute-engine/${id}/edit`)}
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
                <span style={{ color: STATUS_COLORS[computeEngine.status] }}>
                  [ {computeEngine.status.toUpperCase()} ]
                </span>
              </dd>

              <dt style={{ color: 'var(--dash-accent)' }}>Region</dt>
              <dd>{computeEngine.region}</dd>

              <dt style={{ color: 'var(--dash-accent)' }}>CPU</dt>
              <dd>{computeEngine.cpu} cores</dd>

              <dt style={{ color: 'var(--dash-accent)' }}>Memory</dt>
              <dd>{computeEngine.memory} GB</dd>

              <dt style={{ color: 'var(--dash-accent)' }}>Disk</dt>
              <dd>
                {computeEngine.disk} GB ({computeEngine.diskType})
              </dd>

              <dt style={{ color: 'var(--dash-accent)' }}>OS</dt>
              <dd>{computeEngine.os}</dd>

              <dt style={{ color: 'var(--dash-accent)' }}>IP Address</dt>
              <dd>{computeEngine.ipAddress}</dd>

              <dt style={{ color: 'var(--dash-accent)' }}>Created</dt>
              <dd>{new Date(computeEngine.createdAt).toLocaleString()}</dd>
            </dl>

            {/* Delete confirmation modal */}
            <DashboardModal
              isOpen={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              title="Confirm Delete"
            >
              <p style={{ color: 'var(--dash-text)', fontFamily: 'monospace', marginBottom: 12 }}>
                Are you sure you want to delete <strong>{computeEngine.name}</strong>?
              </p>

              {deleteComputeEngine.isError && (
                <p style={{ color: '#e0546a', fontFamily: 'monospace', marginBottom: 12 }}>
                  ✗{' '}
                  {deleteComputeEngine.error instanceof Error
                    ? deleteComputeEngine.error.message
                    : 'Failed to delete Compute Engine'}
                </p>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="fci-linkbtn fci-action-delete"
                  disabled={deleteComputeEngine.isPending}
                  onClick={handleConfirmDelete}
                  style={deleteComputeEngine.isPending ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                >
                  {deleteComputeEngine.isPending ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="fci-linkbtn fci-action-back"
                  disabled={deleteComputeEngine.isPending}
                  onClick={() => setDeleteOpen(false)}
                  style={deleteComputeEngine.isPending ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
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
