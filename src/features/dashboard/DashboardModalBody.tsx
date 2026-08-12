import { TerminalSelect } from '@/components/TerminalSelect'
import type { Vm } from '@/features/vm/types'
import type { Database } from '@/features/database/types'
import type { IamUser, IamUserRole } from '@/features/iam/types'
import type { Bucket } from '@/features/storage/types'
import type { Network } from '@/features/network/types'
import type { CopyState } from '@/features/database/store'
import type { ModalAction } from '@/features/dashboard/constants'

const IAM_ROLE_OPTIONS: ReadonlyArray<{ value: IamUserRole; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'auditor', label: 'Auditor' },
]

function isIamUserRole(value: string): value is IamUserRole {
  return IAM_ROLE_OPTIONS.some((option) => option.value === value)
}

interface DashboardModalBodyProps {
  modalAction: ModalAction
  selectedVm: Vm | null
  selectedDatabase: Database | null
  selectedIamUser: IamUser | null
  selectedBucket: Bucket | null
  selectedNetwork: Network | null
  deleteError: string | null
  iamActionError: string | null
  copyState: CopyState
  copyConnectionString: (text: string) => void
  closeModal: () => void
  confirmModalAction: () => void
  modalIsPending: boolean
  iamEditRole: IamUserRole
  setIamEditRole: (role: IamUserRole) => void
}

export function DashboardModalBody({
  modalAction,
  selectedVm,
  selectedDatabase,
  selectedIamUser,
  selectedBucket,
  selectedNetwork,
  deleteError,
  iamActionError,
  copyState,
  copyConnectionString,
  closeModal,
  confirmModalAction,
  modalIsPending,
  iamEditRole,
  setIamEditRole,
}: DashboardModalBodyProps) {
  return (
    <>
      {modalAction === 'delete' && selectedVm && (
        <>
          <p className="fci-modal-message">Delete VM <strong style={{ color: 'var(--dash-label)' }}>{selectedVm.name}</strong>?</p>
          <p className="fci-modal-sub">This action cannot be undone.</p>
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
              Cancel
            </button>
            <button type="button" className="fci-modal-btn fci-modal-btn-danger" onClick={confirmModalAction} disabled={modalIsPending}>
              {modalIsPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </>
      )}
      {modalAction === 'stop' && selectedVm && (
        <>
          <p className="fci-modal-message">Stop VM <strong style={{ color: 'var(--dash-label)' }}>{selectedVm.name}</strong>?</p>
          <p className="fci-modal-sub">The VM will be gracefully shut down.</p>
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
              Cancel
            </button>
            <button type="button" className="fci-modal-btn" onClick={confirmModalAction} disabled={modalIsPending}>
              {modalIsPending ? 'Stopping…' : 'Stop VM'}
            </button>
          </div>
        </>
      )}
      {modalAction === 'reboot' && selectedVm && (
        <>
          <p className="fci-modal-message">Reboot VM <strong style={{ color: 'var(--dash-label)' }}>{selectedVm.name}</strong>?</p>
          <p className="fci-modal-sub">The VM will restart. It will briefly enter a pending state.</p>
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
              Cancel
            </button>
            <button type="button" className="fci-modal-btn" onClick={confirmModalAction} disabled={modalIsPending}>
              {modalIsPending ? 'Rebooting…' : 'Reboot VM'}
            </button>
          </div>
        </>
      )}
      {modalAction === 'db-delete' && selectedDatabase && (
        <>
          <p className="fci-modal-message">Delete database <strong style={{ color: 'var(--dash-label)' }}>{selectedDatabase.name}</strong>?</p>
          <p className="fci-modal-sub">This action cannot be undone.</p>
          {deleteError && (
            <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
              ✗ {deleteError}
            </div>
          )}
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
              Cancel
            </button>
            <button type="button" className="fci-modal-btn fci-modal-btn-danger" onClick={confirmModalAction} disabled={modalIsPending}>
              {modalIsPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </>
      )}
      {modalAction === 'db-connect' && selectedDatabase && (
        <>
          <p className="fci-modal-message">Connection string for <strong style={{ color: 'var(--dash-label)' }}>{selectedDatabase.name}</strong>:</p>
          <p className="fci-modal-sub" style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--dash-text)' }}>
            {selectedDatabase.connectionString}
          </p>
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal}>
              Close
            </button>
            <button type="button" className="fci-modal-btn" onClick={() => copyConnectionString(selectedDatabase.connectionString)} style={{ color: copyState === 'failed' ? '#e0546a' : undefined }}>
              {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Failed' : 'Copy'}
            </button>
          </div>
        </>
      )}
      {modalAction === 'db-backup' && selectedDatabase && (
        <>
          <p className="fci-modal-message">Backup initiated for <strong style={{ color: 'var(--dash-label)' }}>{selectedDatabase.name}</strong>.</p>
          <p className="fci-modal-sub">This is a demo action — no real backup is taken.</p>
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal}>
              Close
            </button>
          </div>
        </>
      )}
      {modalAction === 'db-restore' && selectedDatabase && (
        <>
          <p className="fci-modal-message">Restore is not available in demo mode.</p>
          <p className="fci-modal-sub">No changes were made to <strong style={{ color: 'var(--dash-label)' }}>{selectedDatabase.name}</strong>.</p>
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal}>
              Close
            </button>
          </div>
        </>
      )}
      {modalAction === 'iam-edit-role' && selectedIamUser && (
        <>
          <p className="fci-modal-message">
            Change role for <strong style={{ color: 'var(--dash-label)' }}>{selectedIamUser.name}</strong>:
          </p>
          <div style={{ margin: '12px 0' }}>
            <TerminalSelect
              id="iam-modal-role"
              label="New Role"
              value={iamEditRole}
              options={IAM_ROLE_OPTIONS}
              onChange={(value) => {
                if (isIamUserRole(value)) setIamEditRole(value)
              }}
            />
          </div>
          {iamActionError && (
            <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
              ✗ {iamActionError}
            </div>
          )}
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
              Cancel
            </button>
            <button
              type="button"
              className="fci-modal-btn"
              onClick={confirmModalAction}
              disabled={modalIsPending}
            >
              {modalIsPending ? 'Updating…' : 'Update Role'}
            </button>
          </div>
        </>
      )}
      {modalAction === 'iam-revoke' && selectedIamUser && (
        <>
          <p className="fci-modal-message">
            Revoke access for <strong style={{ color: 'var(--dash-label)' }}>{selectedIamUser.name}</strong>?
          </p>
          <p className="fci-modal-sub">
            The user&apos;s status will be set to <strong>disabled</strong>. They will no longer be able to log in.
          </p>
          {iamActionError && (
            <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
              ✗ {iamActionError}
            </div>
          )}
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
              Cancel
            </button>
            <button
              type="button"
              className="fci-modal-btn fci-modal-btn-danger"
              onClick={confirmModalAction}
              disabled={modalIsPending}
            >
              {modalIsPending ? 'Revoking…' : 'Revoke Access'}
            </button>
          </div>
        </>
      )}
      {modalAction === 'iam-delete' && selectedIamUser && (
        <>
          <p className="fci-modal-message">Delete user <strong style={{ color: 'var(--dash-label)' }}>{selectedIamUser.name}</strong>?</p>
          <p className="fci-modal-sub">This action cannot be undone.</p>
          {iamActionError && (
            <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
              ✗ {iamActionError}
            </div>
          )}
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
              Cancel
            </button>
            <button type="button" className="fci-modal-btn fci-modal-btn-danger" onClick={confirmModalAction} disabled={modalIsPending}>
              {modalIsPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </>
      )}
      {modalAction === 'storage-delete' && selectedBucket && (
        <>
          <p className="fci-modal-message">Delete bucket <strong style={{ color: 'var(--dash-label)' }}>{selectedBucket.bucketName}</strong>?</p>
          <p className="fci-modal-sub">This action cannot be undone.</p>
          {deleteError && (
            <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
              ✗ {deleteError}
            </div>
          )}
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
              Cancel
            </button>
            <button type="button" className="fci-modal-btn fci-modal-btn-danger" onClick={confirmModalAction} disabled={modalIsPending}>
              {modalIsPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </>
      )}
      {modalAction === 'storage-upload' && (
        <>
          <p className="fci-modal-message">File upload is not available in demo mode.</p>
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal}>
              Close
            </button>
          </div>
        </>
      )}
      {modalAction === 'storage-policy' && (
        <>
          <p className="fci-modal-message">Policy management coming soon.</p>
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal}>
              Close
            </button>
          </div>
        </>
      )}
      {modalAction === 'network-delete' && selectedNetwork && (
        <>
          <p className="fci-modal-message">Delete network <strong style={{ color: 'var(--dash-label)' }}>{selectedNetwork.vpcName}</strong>?</p>
          <p className="fci-modal-sub">This action cannot be undone.</p>
          {deleteError && (
            <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
              ✗ {deleteError}
            </div>
          )}
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
              Cancel
            </button>
            <button type="button" className="fci-modal-btn fci-modal-btn-danger" onClick={confirmModalAction} disabled={modalIsPending}>
              {modalIsPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </>
      )}
      {modalAction === 'network-vpn' && (
        <>
          <p className="fci-modal-message">VPN creation is not available in demo mode.</p>
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={closeModal}>
              Close
            </button>
          </div>
        </>
      )}
    </>
  )
}
