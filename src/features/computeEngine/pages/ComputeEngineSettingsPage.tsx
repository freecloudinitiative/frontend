import { useState, useEffect } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { SettingsInfoPanel } from '@/components/SettingsInfoPanel'
import { useComputeEngine, useComputeEngines, useUpdateComputeEngineSettings } from '@/features/computeEngine/hooks'
import { useToastStore } from '@/store/toastStore'

interface ComputeEngineSettingsPageProps {
  onBack: () => void
  selectedRowId?: string | null
}

const BACKUP_OPTIONS = ['Enabled', 'Disabled']
const CPU_LIMIT_OPTIONS = ['1 core', '2 cores', '4 cores', '8 cores', '16 cores']

export function ComputeEngineSettingsPage({ onBack, selectedRowId }: ComputeEngineSettingsPageProps) {
  const { data: computeEngines } = useComputeEngines()
  const activeComputeEngineId = selectedRowId || computeEngines?.[0]?.id || ''
  const { data: computeEngine } = useComputeEngine(activeComputeEngineId)
  const updateSettings = useUpdateComputeEngineSettings()
  const addToast = useToastStore((state) => state.addToast)

  const [hostname, setHostname] = useState('')
  const [autoBackups, setAutoBackups] = useState('Enabled')
  const [cpuLimit, setCpuLimit] = useState('16 cores')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (computeEngine) {
      setHostname(computeEngine.name ? `${computeEngine.name}.internal` : 'ce-host-01.internal')
      setAutoBackups(computeEngine.autoBackups ? 'Enabled' : 'Disabled')
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
          autoBackups: autoBackups === 'Enabled',
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
              <div className="fci-field-with-help">
                <div className="fci-fieldbox">
                  <label htmlFor="ce-hostname" className="fci-box-label">Hostname</label>
                  <TerminalInput
                    id="ce-hostname"
                    type="text"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                    placeholder="e.g. web-01.internal"
                    disabled
                  />
                </div>
                <p className="fci-field-help">Not available in v1.</p>
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
              <div className="fci-field-with-help">
                <TerminalSelect
                  id="ce-cpu-limit"
                  label="vCPU Limit"
                  value={cpuLimit}
                  options={CPU_LIMIT_OPTIONS}
                  onChange={(val) => setCpuLimit(val)}
                  disabled
                />
                <p className="fci-field-help">Not available in v1.</p>
              </div>
              <div className="fci-field-with-help">
                <div className="fci-fieldbox">
                  <label htmlFor="ce-tags" className="fci-box-label">Instance Tagging (csv)</label>
                  <TerminalInput
                    id="ce-tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="production, web, europe"
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

        <SettingsInfoPanel service="Compute Engine" paragraphs={[
          'Configure automatic backups for the selected virtual machine. Changes apply only to this Compute Engine instance.',
          'Automatic backups provide scheduled disk protection; restoration remains unavailable to customers in v1.',
          'Hostname, vCPU limits, and instance tags are shown for context but cannot be changed in v1.',
        ]} />
      </div>
    </div>
  )
}
