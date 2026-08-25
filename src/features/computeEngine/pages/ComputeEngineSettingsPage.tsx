import { useState, useEffect } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useComputeEngine, useComputeEngines, useUpdateComputeEngineSettings } from '@/features/computeEngine/hooks'
import { useToastStore } from '@/store/toastStore'

interface ComputeEngineSettingsPageProps {
  onBack: () => void
  selectedRowId?: string | null
}

const BACKUP_OPTIONS = ['Enabled', 'Disabled']
const CPU_LIMIT_OPTIONS = ['1 core', '2 cores', '4 cores', '8 cores', '16 cores', 'Unlimited']

export function ComputeEngineSettingsPage({ onBack, selectedRowId }: ComputeEngineSettingsPageProps) {
  const { data: computeEngines } = useComputeEngines()
  const activeComputeEngineId = selectedRowId || computeEngines?.[0]?.id || ''
  const { data: computeEngine } = useComputeEngine(activeComputeEngineId)
  const updateSettings = useUpdateComputeEngineSettings()
  const addToast = useToastStore((state) => state.addToast)

  const [hostname, setHostname] = useState('')
  const [autoBackups, setAutoBackups] = useState('Enabled')
  const [cpuLimit, setCpuLimit] = useState('Unlimited')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (computeEngine) {
      setHostname(computeEngine.name ? `${computeEngine.name}.internal` : 'ce-host-01.internal')
    }
  }, [computeEngine])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeComputeEngineId) {
      addToast('No Compute Engine selected for settings update', 'error')
      return
    }

    updateSettings.mutate(
      {
        id: activeComputeEngineId,
        settings: {
          hostname,
          autoBackups: autoBackups === 'Enabled',
          cpuLimit,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      },
      {
        onSuccess: () => {
          addToast(`Compute Engine settings updated for ${computeEngine?.name || activeComputeEngineId}`, 'success')
        },
        onError: () => {
          addToast('Failed to update Compute Engine settings', 'error')
        },
      },
    )
  }

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Compute Engine Settings {computeEngine ? `— ${computeEngine.name}` : ''}</div>
      <IconButton variant="back" placement="notch" onClick={onBack} title="Back" ariaLabel="Back" />

      <div className="fci-split-layout" style={{ marginTop: 14 }}>
        <div className="fci-split-fields">
          <form onSubmit={handleSubmit} noValidate>
            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="ce-hostname" className="fci-box-label">Hostname</label>
                <TerminalInput
                  id="ce-hostname"
                  type="text"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  placeholder="e.g. web-01.internal"
                />
              </div>
              <div className="fci-field-with-help">
                <TerminalSelect
                  id="ce-auto-backups"
                  label="Automatic Backups"
                  value={autoBackups}
                  options={BACKUP_OPTIONS}
                  onChange={(val) => setAutoBackups(val)}
                />
                <p className="fci-field-help">
                  Nightly crash-consistent disk backup. Retained for 7 days by default. Not continuous,
                  point-in-time, or application-consistent protection. Customer-facing restore is not available in v1.
                </p>
              </div>
            </div>

            <div className="fci-fieldrow">
              <TerminalSelect
                id="ce-cpu-limit"
                label="CPU Limit"
                value={cpuLimit}
                options={CPU_LIMIT_OPTIONS}
                onChange={(val) => setCpuLimit(val)}
              />
              <div className="fci-fieldbox">
                <label htmlFor="ce-tags" className="fci-box-label">Instance Tagging (csv)</label>
                <TerminalInput
                  id="ce-tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="production, web, europe"
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
