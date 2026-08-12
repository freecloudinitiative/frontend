import { useState, useEffect } from 'react'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useVm, useVms, useUpdateVmSettings } from '@/features/vm/hooks'
import { useToastStore } from '@/store/toastStore'

interface VmSettingsPageProps {
  onBack: () => void
  selectedRowId?: string | null
}

const BACKUP_OPTIONS = ['Enabled', 'Disabled']
const CPU_LIMIT_OPTIONS = ['1 core', '2 cores', '4 cores', '8 cores', '16 cores', 'Unlimited']

export function VmSettingsPage({ onBack, selectedRowId }: VmSettingsPageProps) {
  const { data: vms } = useVms()
  const activeVmId = selectedRowId || vms?.[0]?.id || ''
  const { data: vm } = useVm(activeVmId)
  const updateSettings = useUpdateVmSettings()
  const addToast = useToastStore((state) => state.addToast)

  const [hostname, setHostname] = useState('')
  const [autoBackups, setAutoBackups] = useState('Enabled')
  const [cpuLimit, setCpuLimit] = useState('Unlimited')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (vm) {
      setHostname(vm.name ? `${vm.name}.internal` : 'vm-host-01.internal')
    }
  }, [vm])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeVmId) {
      addToast('No VM selected for settings update', 'error')
      return
    }

    updateSettings.mutate(
      {
        id: activeVmId,
        settings: {
          hostname,
          autoBackups: autoBackups === 'Enabled',
          cpuLimit,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      },
      {
        onSuccess: () => {
          addToast(`VM settings updated for ${vm?.name || activeVmId}`, 'success')
        },
        onError: () => {
          addToast('Failed to update VM settings', 'error')
        },
      },
    )
  }

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">VM Settings {vm ? `— ${vm.name}` : ''}</div>
      <button
        type="button"
        className="fci-linkbtn fci-action-back fci-box-key-top"
        onClick={onBack}
        aria-label="Back"
        title="Back"
      >
        &lt;&lt;
      </button>

      <div className="fci-split-layout" style={{ marginTop: 14 }}>
        <div className="fci-split-fields">
          <form onSubmit={handleSubmit} noValidate>
            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="vm-hostname" className="fci-box-label">Hostname</label>
                <TerminalInput
                  id="vm-hostname"
                  type="text"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  placeholder="e.g. web-01.internal"
                />
              </div>
              <TerminalSelect
                id="vm-auto-backups"
                label="Automatic Backups"
                value={autoBackups}
                options={BACKUP_OPTIONS}
                onChange={(val) => setAutoBackups(val)}
              />
            </div>

            <div className="fci-fieldrow">
              <TerminalSelect
                id="vm-cpu-limit"
                label="CPU Limit"
                value={cpuLimit}
                options={CPU_LIMIT_OPTIONS}
                onChange={(val) => setCpuLimit(val)}
              />
              <div className="fci-fieldbox">
                <label htmlFor="vm-tags" className="fci-box-label">Instance Tagging (csv)</label>
                <TerminalInput
                  id="vm-tags"
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
