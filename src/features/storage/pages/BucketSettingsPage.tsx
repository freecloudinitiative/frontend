import { useState, useEffect, useRef } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import {
  useBucket,
  useBuckets,
  useUpdateBucketSettings,
  useBucketFiles,
  useUploadObject,
  useDownloadObject,
  useDeleteObject,
} from '@/features/storage/hooks'
import { MAX_UPLOAD_BYTES } from '@/features/storage/api'
import { useToastStore } from '@/store/toastStore'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatBytes, formatDate } from '@/lib/format'

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

  const addToast = useToastStore((state) => state.addToast)

  const [versioning, setVersioning] = useState('Enabled')
  const [publicReadAccess, setPublicReadAccess] = useState('Disabled')
  const [corsRules, setCorsRules] = useState('*')

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (bucket) {
      setPublicReadAccess(bucket.access.includes('public') ? 'Enabled' : 'Disabled')
    }
  }, [bucket])

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
          corsRules,
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
              <div className="fci-fieldbox">
                <label htmlFor="bucket-cors" className="fci-box-label">CORS Rule Configuration</label>
                <TerminalInput
                  id="bucket-cors"
                  type="text"
                  value={corsRules}
                  onChange={(e) => setCorsRules(e.target.value)}
                  placeholder="GET, PUT, POST (*)"
                />
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

