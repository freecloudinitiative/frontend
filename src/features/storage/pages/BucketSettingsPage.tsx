import { useState, useEffect } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useBucket, useBuckets, useUpdateBucketSettings } from '@/features/storage/hooks'
import { useToastStore } from '@/store/toastStore'

interface BucketSettingsPageProps {
  onBack: () => void
  selectedRowId?: string | null
}

const TOGGLE_OPTIONS = ['Enabled', 'Disabled']

export function BucketSettingsPage({ onBack, selectedRowId }: BucketSettingsPageProps) {
  const { data: buckets } = useBuckets()
  const activeBucketId = selectedRowId || buckets?.[0]?.id || ''
  const { data: bucket } = useBucket(activeBucketId)
  const updateSettings = useUpdateBucketSettings()
  const addToast = useToastStore((state) => state.addToast)

  const [versioning, setVersioning] = useState('Enabled')
  const [publicReadAccess, setPublicReadAccess] = useState('Disabled')
  const [corsRules, setCorsRules] = useState('*')

  useEffect(() => {
    if (bucket) {
      setPublicReadAccess(bucket.access.includes('public') ? 'Enabled' : 'Disabled')
    }
  }, [bucket])

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

      <div className="fci-split-layout" style={{ marginTop: 14 }}>
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
