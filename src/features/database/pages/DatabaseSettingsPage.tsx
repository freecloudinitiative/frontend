import { useState, useEffect } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useDatabase, useDatabases, useUpdateDatabaseSettings } from '@/features/database/hooks'
import { useToastStore } from '@/store/toastStore'
import { DATABASE_CPU_OPTIONS, DATABASE_MEMORY_OPTIONS } from '@/features/database/options'
import type { DatabaseStatus } from '@/features/database/types'

interface DatabaseSettingsPageProps {
  onBack: () => void
  selectedRowId?: string | null
}

const STATUS_OPTIONS: readonly DatabaseStatus[] = ['running', 'stopped', 'pending']

export function DatabaseSettingsPage({ onBack, selectedRowId }: DatabaseSettingsPageProps) {
  const { data: databases } = useDatabases()
  const activeDbId = selectedRowId || databases?.[0]?.id || ''
  const { data: db } = useDatabase(activeDbId)
  const updateSettings = useUpdateDatabaseSettings()
  const addToast = useToastStore((state) => state.addToast)

  const [cpu, setCpu] = useState('1')
  const [memory, setMemory] = useState('1')
  const [storageSize, setStorageSize] = useState('1')
  const [status, setStatus] = useState<DatabaseStatus>('running')
  const [storageError, setStorageError] = useState<string | null>(null)

  useEffect(() => {
    if (db) {
      setCpu(String(db.cpu))
      setMemory(String(db.memory))
      setStorageSize(String(db.storageSize))
      setStatus(db.status)
      setStorageError(null)
    }
  }, [db])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeDbId) {
      addToast('No Database selected for settings update', 'error')
      return
    }

    const nextStorageSize = Number(storageSize)
    if (!Number.isInteger(nextStorageSize) || nextStorageSize < (db?.storageSize ?? 1)) {
      setStorageError(`Storage size must be at least ${db?.storageSize ?? 1} GB`)
      return
    }
    setStorageError(null)

    updateSettings.mutate(
      {
        id: activeDbId,
        settings: {
          cpu: Number(cpu),
          memory: Number(memory),
          storageSize: nextStorageSize,
          status,
        },
      },
      {
        onSuccess: () => {
          addToast(`Database settings updated for ${db?.name || activeDbId}`, 'success')
        },
        onError: () => {
          addToast('Failed to update Database settings', 'error')
        },
      },
    )
  }

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Database Settings {db ? `— ${db.name}` : ''}</div>
      <IconButton variant="back" placement="notch" onClick={onBack} title="Back" ariaLabel="Back" />

      <div className="fci-split-layout" style={{ marginTop: 14 }}>
        <div className="fci-split-fields">
          <form onSubmit={handleSubmit} noValidate>
            <div className="fci-fieldrow">
              <TerminalSelect
                id="db-settings-cpu"
                label="vCPU (cores)"
                value={cpu}
                options={DATABASE_CPU_OPTIONS}
                onChange={setCpu}
              />
              <TerminalSelect
                id="db-settings-memory"
                label="Memory (GB)"
                value={memory}
                options={DATABASE_MEMORY_OPTIONS}
                onChange={setMemory}
              />
            </div>

            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="db-settings-storage" className="fci-box-label">Storage Size (GB)</label>
                <TerminalInput
                  id="db-settings-storage"
                  type="number"
                  min={db?.storageSize ?? 1}
                  step="1"
                  hasError={Boolean(storageError)}
                  value={storageSize}
                  onChange={(e) => setStorageSize(e.target.value)}
                />
                {storageError && <div className="fci-form-error">{storageError}</div>}
              </div>
              <TerminalSelect
                id="db-settings-status"
                label="Status"
                value={status}
                options={STATUS_OPTIONS}
                onChange={(value) => setStatus(value as DatabaseStatus)}
              />
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

        <div className="fci-split-info">
          <h3>About Database Service Settings</h3>
          <p>Adjust compute capacity, memory, storage, and runtime status for the selected managed database.</p>
          <p>Storage can be increased as your data grows, but it cannot be reduced after provisioning.</p>
          <p>Saving these settings may briefly affect availability while the database resources are updated.</p>
        </div>
      </div>
    </div>
  )
}
