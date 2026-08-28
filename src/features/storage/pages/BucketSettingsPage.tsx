import { useState, useEffect, useRef } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import {
  useBucket,
  useBuckets,
  useUpdateBucketSettings,
  useBucketFiles,
  useBucketAccessPolicies,
  useCreateBucketAccessPolicy,
  useDeleteBucketAccessPolicy,
  useUploadObject,
  useDownloadObject,
  useDeleteObject,
} from '@/features/storage/hooks'
import { MAX_UPLOAD_BYTES } from '@/features/storage/api'
import { useToastStore } from '@/store/toastStore'
import { getApiErrorMessage, type ApiErrorEnvelope } from '@/lib/apiError'
import { formatBytes, formatDate } from '@/lib/format'
import type { BucketAccessPermission, CreateBucketAccessPolicyInput } from '@/features/storage/types'

interface BucketSettingsPageProps {
  onBack: () => void
  selectedRowId?: string | null
}

const TOGGLE_OPTIONS = ['Enabled', 'Disabled']

export function BucketSettingsPage({ onBack, selectedRowId }: BucketSettingsPageProps) {
  const { data: buckets } = useBuckets()
  const activeBucketId = selectedRowId || buckets?.[0]?.id || ''
  const { data: bucket } = useBucket(activeBucketId)
  const { data: files, isLoading: isLoadingFiles, isError: isErrorFiles } = useBucketFiles(activeBucketId)

  const updateSettings = useUpdateBucketSettings()
  const uploadMutation = useUploadObject(activeBucketId)
  const downloadMutation = useDownloadObject(activeBucketId)
  const deleteMutation = useDeleteObject(activeBucketId)

  // Access policy hooks
  const { data: accessPolicies, isLoading: isLoadingPolicies, isError: isErrorPolicies } = useBucketAccessPolicies(activeBucketId)
  const createPolicyMutation = useCreateBucketAccessPolicy(activeBucketId)
  const deletePolicyMutation = useDeleteBucketAccessPolicy(activeBucketId)

  const addToast = useToastStore((state) => state.addToast)

  const [versioning, setVersioning] = useState('Enabled')
  const [publicReadAccess, setPublicReadAccess] = useState('Disabled')
  const [corsRules, setCorsRules] = useState('*')

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null)

  // Policy create form
  const POLICY_PERMISSION_OPTIONS: { value: BucketAccessPermission; label: string }[] = [
    { value: 'roles/storage.objectViewer', label: 'objectViewer' },
    { value: 'roles/storage.objectAdmin', label: 'objectAdmin' },
    { value: 'roles/storage.admin', label: 'admin' },
  ]

  const INITIAL_POLICY_FORM: CreateBucketAccessPolicyInput = {
    principal: '',
    permission: 'roles/storage.objectViewer',
    resource: '',
  }

  const [policyForm, setPolicyForm] = useState<CreateBucketAccessPolicyInput>(INITIAL_POLICY_FORM)
  const [policyErrors, setPolicyErrors] = useState<Partial<Record<keyof CreateBucketAccessPolicyInput, string>>>({})
  const [deleteConfirmPolicyId, setDeleteConfirmPolicyId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeBucketIdRef = useRef(activeBucketId)
  activeBucketIdRef.current = activeBucketId

  useEffect(() => {
    if (bucket) {
      setPublicReadAccess(bucket.access.includes('public') ? 'Enabled' : 'Disabled')
    }
  }, [bucket])

  // Reset policy form whenever the active bucket changes to prevent stale
  // principal/resource values from a previous bucket being submitted under
  // the new bucket's mutation context.
  useEffect(() => {
    setPolicyForm(INITIAL_POLICY_FORM)
    setPolicyErrors({})
    setDeleteConfirmPolicyId(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBucketId])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    if (file.size > MAX_UPLOAD_BYTES) {
      const errorMsg = `File size (${(file.size / (1024 * 1024)).toFixed(1)} MiB) exceeds the 12 MiB upload limit`
      setUploadError(errorMsg)
      addToast(errorMsg, 'error')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setSelectedFile(file)
  }

  function handleUpload() {
    if (!selectedFile || !activeBucketId) return
    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      const errorMsg = `File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MiB) exceeds the 12 MiB upload limit`
      setUploadError(errorMsg)
      addToast(errorMsg, 'error')
      return
    }

    setUploadError(null)
    setUploadProgress(0)

    uploadMutation.mutate(
      {
        file: selectedFile,
        onProgress: (pct) => setUploadProgress(pct),
      },
      {
        onSuccess: () => {
          addToast(`Uploaded "${selectedFile.name}" successfully`, 'success')
          setSelectedFile(null)
          setUploadProgress(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        },
        onError: (err) => {
          const msg = getApiErrorMessage(err, 'Failed to upload object')
          setUploadError(msg)
          addToast(msg, 'error')
          setUploadProgress(null)
        },
      },
    )
  }

  function handleDownload(key: string) {
    downloadMutation.mutate(key, {
      onSuccess: () => {
        addToast(`Downloaded "${key}"`, 'success')
      },
      onError: (err) => {
        const msg = getApiErrorMessage(err, `Failed to download "${key}"`)
        addToast(msg, 'error')
      },
    })
  }

  function handleDelete(key: string) {
    deleteMutation.mutate(key, {
      onSuccess: () => {
        addToast(`Deleted "${key}"`, 'success')
        setDeleteConfirmKey(null)
      },
      onError: (err) => {
        const msg = getApiErrorMessage(err, `Failed to delete "${key}"`)
        addToast(msg, 'error')
        setDeleteConfirmKey(null)
      },
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeBucketId) {
      addToast('No bucket selected for settings update', 'error')
      return
    }

    updateSettings.mutate(
      {
        id: activeBucketId,
        settings: {
          versioning: versioning === 'Enabled',
          publicReadAccess: publicReadAccess === 'Enabled',
        },
      },
      {
        onSuccess: () => {
          addToast(`Storage settings updated for ${bucket?.bucketName || activeBucketId}`, 'success')
        },
        onError: () => {
          addToast('Failed to update Storage settings', 'error')
        },
      },
    )
  }

  function handlePolicyCreate(e: React.FormEvent) {
    e.preventDefault()
    const errs: Partial<Record<keyof CreateBucketAccessPolicyInput, string>> = {}
    if (!policyForm.principal.trim()) errs.principal = 'Principal is required'
    if (!policyForm.resource.trim()) errs.resource = 'Resource is required'
    setPolicyErrors(errs)
    if (Object.keys(errs).length > 0) return

    const dispatchedForBucketId = activeBucketId

    createPolicyMutation.mutate(policyForm, {
      onSuccess: () => {
        if (activeBucketIdRef.current !== dispatchedForBucketId) return
        addToast('Access policy created', 'success')
        setPolicyForm({ ...INITIAL_POLICY_FORM, resource: bucket ? `buckets/${bucket.bucketName}` : '' })
        setPolicyErrors({})
      },
      onError: (err) => {
        if (activeBucketIdRef.current !== dispatchedForBucketId) return
        const msg = getApiErrorMessage(err, 'Failed to create access policy')
        // Surface field-level errors. The API contract documents details as a
        // field-to-message map: { "principal": "too long" } (API.md:207).
        // Iterate the map and apply all entries whose keys are known fields.
        const errData = (err as { response?: { data?: unknown } })?.response?.data
        if (
          errData &&
          typeof errData === 'object' &&
          !Array.isArray(errData) &&
          'error' in errData
        ) {
          const envelope = (errData as { error: ApiErrorEnvelope }).error
          const details = envelope?.details
          if (details && typeof details === 'object') {
            const POLICY_FIELDS = new Set<string>(['principal', 'permission', 'resource'])
            const fieldErrors: Partial<Record<keyof CreateBucketAccessPolicyInput, string>> = {}
            for (const [key, value] of Object.entries(details)) {
              if (POLICY_FIELDS.has(key) && typeof value === 'string') {
                fieldErrors[key as keyof CreateBucketAccessPolicyInput] = value
              }
            }
            if (Object.keys(fieldErrors).length > 0) {
              setPolicyErrors(fieldErrors)
              addToast(msg, 'error')
              return
            }
          }
        }
        addToast(msg, 'error')
      },
    })
  }

  function handlePolicyDelete(policyId: string) {
    const dispatchedForBucketId = activeBucketId
    deletePolicyMutation.mutate(policyId, {
      onSuccess: () => {
        if (activeBucketIdRef.current !== dispatchedForBucketId) return
        addToast('Access policy removed', 'success')
        setDeleteConfirmPolicyId(null)
      },
      onError: (err) => {
        if (activeBucketIdRef.current !== dispatchedForBucketId) return
        const msg = getApiErrorMessage(err, 'Failed to remove access policy')
        addToast(msg, 'error')
        setDeleteConfirmPolicyId(null)
      },
    })
  }

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Storage Settings {bucket ? `— ${bucket.bucketName}` : ''}</div>
      <IconButton variant="back" placement="notch" onClick={onBack} title="Back" ariaLabel="Back" />

      {/* ── Objects Browser & Upload Section ─────────────────────────────── */}
      <div style={{ marginTop: 14 }}>
        <div className="fci-section-title">Bucket Objects</div>

        {/* Upload Control */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="bucket-object-file-input"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            disabled={uploadMutation.isPending}
          />

          <button
            type="button"
            className="fci-btn fci-btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {selectedFile ? 'Change File…' : 'Select File to Upload…'}
          </button>

          {selectedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--dash-label)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                {selectedFile.name} ({formatBytes(selectedFile.size)})
              </span>
              <button
                type="button"
                className="fci-btn fci-btn-primary"
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? `Uploading (${uploadProgress ?? 0}%)…` : 'Upload'}
              </button>
              <button
                type="button"
                className="fci-btn fci-btn-secondary"
                onClick={() => {
                  setSelectedFile(null)
                  setUploadError(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </button>
            </div>
          )}

          {uploadMutation.isPending && uploadProgress !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
              <progress
                value={uploadProgress}
                max={100}
                style={{ width: 120, height: 8 }}
                aria-label="Upload progress"
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--dash-text-dim)' }}>{uploadProgress}%</span>
            </div>
          )}
        </div>

        {uploadError && (
          <div style={{ color: '#e0546a', fontSize: '0.82rem', marginBottom: 10 }}>
            ✗ {uploadError}
          </div>
        )}

        {/* Objects Table */}
        <table className="fci-table" style={{ width: '100%', marginBottom: 20 }}>
          <thead>
            <tr>
              <th>Key</th>
              <th>Size</th>
              <th>Modified</th>
              <th>Class</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingFiles ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--dash-text-dim)', padding: '1rem 0' }}>
                  Loading objects…
                </td>
              </tr>
            ) : isErrorFiles ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#e0546a', padding: '1rem 0' }}>
                  Failed to load objects.
                </td>
              </tr>
            ) : !files || files.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--dash-text-dim)', padding: '1rem 0' }}>
                  No objects in this bucket.
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.id}>
                  <td style={{ color: 'var(--dash-label)', fontFamily: 'monospace' }}>{file.key}</td>
                  <td>{formatBytes(file.size)}</td>
                  <td style={{ color: 'var(--dash-text-dim)' }}>{formatDate(file.lastModified)}</td>
                  <td>{file.storageClass.toUpperCase()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        className="fci-btn fci-btn-secondary"
                        style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                        title="Download file"
                        aria-label={`Download ${file.key}`}
                        disabled={downloadMutation.isPending}
                        onClick={() => handleDownload(file.key)}
                      >
                        ↓ Download
                      </button>

                      {deleteConfirmKey === file.key ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: '0.75rem', color: '#e0546a' }}>Confirm?</span>
                          <button
                            type="button"
                            className="fci-btn fci-btn-primary"
                            style={{
                              padding: '0.15rem 0.45rem',
                              fontSize: '0.75rem',
                              borderColor: '#e0546a',
                              color: '#e0546a',
                            }}
                            title="Confirm delete"
                            aria-label={`Confirm delete ${file.key}`}
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(file.key)}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            className="fci-btn fci-btn-secondary"
                            style={{ padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}
                            title="Cancel delete"
                            aria-label="Cancel delete"
                            onClick={() => setDeleteConfirmKey(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="fci-btn fci-btn-secondary"
                          style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem', color: '#e0546a' }}
                          title="Delete file"
                          aria-label={`Delete ${file.key}`}
                          onClick={() => setDeleteConfirmKey(file.key)}
                        >
                          ✕ Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Access Policies Section ───────────────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <div className="fci-section-title">Access Policies</div>

        {/*
         * LIMITATION NOTICE — required deliverable, not optional.
         * Policies are Postgres records only. The storage backend uses a single
         * shared platform S3 credential for all tenants; no per-principal
         * identity ever reaches the object store, so no per-principal rule can
         * be applied there. See storage-service PR-04 and policy_test.go:399-412.
         */}
        <div
          role="note"
          aria-label="Access policy limitation notice"
          data-testid="policy-limitation-notice"
          style={{
            marginTop: 10,
            marginBottom: 16,
            padding: '10px 14px',
            borderLeft: '3px solid #c8891a',
            background: 'rgba(200, 137, 26, 0.08)',
            borderRadius: '0 4px 4px 0',
            fontSize: '0.83rem',
            lineHeight: 1.55,
            color: 'var(--dash-text)',
          }}
        >
          <strong style={{ color: '#c8891a', display: 'block', marginBottom: 4 }}>
            ⚠ Access policies are recorded but not enforced in v1.
          </strong>
          The storage backend uses a single shared platform credential for all tenants. No
          per-principal identity reaches the object store, so no per-principal rule can be applied
          there. Access is controlled by account and bucket isolation (prefix{' '}
          <code style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{'{accountID}/{bucketID}/'}</code>
          ), object-key sanitisation, and account scoping in SQL. Policy rows are stored for
          future enforcement when per-tenant credentials are introduced.
        </div>

        {/* Create policy form */}
        <form onSubmit={handlePolicyCreate} noValidate style={{ marginBottom: 18 }}>
          <div className="fci-fieldrow">
            <div className="fci-fieldbox">
              <label htmlFor="policy-create-principal" className="fci-box-label">Principal</label>
              <TerminalInput
                id="policy-create-principal"
                type="text"
                placeholder="user:alice@example.com"
                value={policyForm.principal}
                hasError={Boolean(policyErrors.principal)}
                onChange={(e) => setPolicyForm((f) => ({ ...f, principal: e.target.value }))}
                disabled={createPolicyMutation.isPending}
              />
              {policyErrors.principal && (
                <div className="fci-form-error" data-testid="policy-principal-error">{policyErrors.principal}</div>
              )}
            </div>

            <div>
              <TerminalSelect
                id="policy-create-permission"
                label="Permission"
                value={policyForm.permission}
                options={POLICY_PERMISSION_OPTIONS}
                hasError={Boolean(policyErrors.permission)}
                onChange={(val) => setPolicyForm((f) => ({ ...f, permission: val as BucketAccessPermission }))}
              />
              {policyErrors.permission && (
                <div className="fci-form-error" data-testid="policy-permission-error">{policyErrors.permission}</div>
              )}
            </div>
          </div>

          <div className="fci-fieldrow">
            <div className="fci-fieldbox">
              <label htmlFor="policy-create-resource" className="fci-box-label">Resource</label>
              <TerminalInput
                id="policy-create-resource"
                type="text"
                placeholder={`buckets/${bucket?.bucketName ?? 'my-bucket'}`}
                value={policyForm.resource}
                hasError={Boolean(policyErrors.resource)}
                onChange={(e) => setPolicyForm((f) => ({ ...f, resource: e.target.value }))}
                disabled={createPolicyMutation.isPending}
              />
              {policyErrors.resource && (
                <div className="fci-form-error" data-testid="policy-resource-error">{policyErrors.resource}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              type="submit"
              id="policy-create-submit"
              className="fci-linkbtn fci-action-add"
              style={{ padding: '6px 14px' }}
              disabled={createPolicyMutation.isPending}
            >
              {createPolicyMutation.isPending ? 'Adding…' : '+ Add Policy'}
            </button>
          </div>
        </form>

        {/* Policies table */}
        <table className="fci-table" style={{ width: '100%', marginBottom: 20 }}>
          <thead>
            <tr>
              <th>Principal</th>
              <th>Permission</th>
              <th>Resource</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingPolicies ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--dash-text-dim)', padding: '1rem 0' }}>
                  Loading policies…
                </td>
              </tr>
            ) : isErrorPolicies ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#e0546a', padding: '1rem 0' }}>
                  Failed to load access policies.
                </td>
              </tr>
            ) : !accessPolicies || accessPolicies.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--dash-text-dim)', padding: '1rem 0' }}>
                  No access policies on this bucket.
                </td>
              </tr>
            ) : (
              accessPolicies.map((policy) => (
                <tr key={policy.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--dash-label)', fontSize: '0.82rem' }}>
                    {policy.principal}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{policy.permission}</td>
                  <td style={{ color: 'var(--dash-text-dim)', fontSize: '0.82rem' }}>{policy.resource}</td>
                  <td style={{ color: 'var(--dash-text-dim)' }}>{formatDate(policy.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      {deleteConfirmPolicyId === policy.id ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: '0.75rem', color: '#e0546a' }}>Remove?</span>
                          <button
                            type="button"
                            className="fci-btn fci-btn-primary"
                            style={{
                              padding: '0.15rem 0.45rem',
                              fontSize: '0.75rem',
                              borderColor: '#e0546a',
                              color: '#e0546a',
                            }}
                            aria-label={`Confirm remove policy ${policy.id}`}
                            disabled={deletePolicyMutation.isPending}
                            onClick={() => handlePolicyDelete(policy.id)}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            className="fci-btn fci-btn-secondary"
                            style={{ padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}
                            aria-label="Cancel policy removal"
                            onClick={() => setDeleteConfirmPolicyId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="fci-btn fci-btn-secondary"
                          style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem', color: '#e0546a' }}
                          aria-label={`Remove policy ${policy.id}`}
                          onClick={() => setDeleteConfirmPolicyId(policy.id)}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Settings Form Section ────────────────────────────────────────── */}
      <div className="fci-section-title">Configuration</div>
      <div className="fci-split-layout" style={{ marginTop: 8 }}>
        <div className="fci-split-fields">
          <form onSubmit={handleSubmit} noValidate>
            <div className="fci-fieldrow">
              <TerminalSelect
                id="bucket-versioning"
                label="Object Versioning"
                value={versioning}
                options={TOGGLE_OPTIONS}
                onChange={(val) => setVersioning(val)}
              />
              <TerminalSelect
                id="bucket-public-read"
                label="Public Read Access"
                value={publicReadAccess}
                options={TOGGLE_OPTIONS}
                onChange={(val) => setPublicReadAccess(val)}
              />
            </div>

            <div className="fci-fieldrow">
              <div className="fci-field-with-help">
                <div className="fci-fieldbox">
                  <label htmlFor="bucket-cors" className="fci-box-label">CORS Rule Configuration</label>
                  <TerminalInput
                    id="bucket-cors"
                    type="text"
                    value={corsRules}
                    onChange={(e) => setCorsRules(e.target.value)}
                    placeholder="GET, PUT, POST (*)"
                    disabled
                  />
                </div>
                <p className="fci-field-help">Not available in v1.</p>
              </div>
            </div>

            <div className="fci-form-actions" style={{ marginTop: 16 }}>
              <button
                type="submit"
                className="fci-btn fci-btn-primary"
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
              </button>
              <button type="button" className="fci-btn fci-btn-secondary" onClick={onBack}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
