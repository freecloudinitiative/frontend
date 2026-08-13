import { useState, useEffect } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useDatabase, useDatabases, useUpdateDatabaseSettings } from '@/features/database/hooks'
import { useToastStore } from '@/store/toastStore'

interface DatabaseSettingsPageProps {
  onBack: () => void
  selectedRowId?: string | null
}

const TOGGLE_OPTIONS = ['Enabled', 'Disabled']
const WINDOW_OPTIONS = ['Sun 02:00-04:00 UTC', 'Sat 01:00-03:00 UTC', 'Sun 04:00-06:00 UTC', 'Manual Only']

export function DatabaseSettingsPage({ onBack, selectedRowId }: DatabaseSettingsPageProps) {
  const { data: databases } = useDatabases()
  const activeDbId = selectedRowId || databases?.[0]?.id || ''
  const { data: db } = useDatabase(activeDbId)
  const updateSettings = useUpdateDatabaseSettings()
  const addToast = useToastStore((state) => state.addToast)

  const [maintenanceWindow, setMaintenanceWindow] = useState('Sun 02:00-04:00 UTC')
  const [autoFailover, setAutoFailover] = useState('Enabled')
  const [queryLogging, setQueryLogging] = useState('Enabled')
  const [connectionLimit, setConnectionLimit] = useState('100')

  useEffect(() => {
    if (db) {
      setConnectionLimit(String(db.maxConnections || 100))
    }
  }, [db])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeDbId) {
      addToast('No Database selected for settings update', 'error')
      return
    }

    updateSettings.mutate(
      {
        id: activeDbId,
        settings: {
          maintenanceWindow,
          autoFailover: autoFailover === 'Enabled',
          queryLogging: queryLogging === 'Enabled',
          connectionLimit: Number(connectionLimit),
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
                id="db-maint-window"
                label="Maintenance Window"
                value={maintenanceWindow}
                options={WINDOW_OPTIONS}
                onChange={(val) => setMaintenanceWindow(val)}
              />
              <TerminalSelect
                id="db-auto-failover"
                label="Auto-failover"
                value={autoFailover}
                options={TOGGLE_OPTIONS}
                onChange={(val) => setAutoFailover(val)}
              />
            </div>

            <div className="fci-fieldrow">
              <TerminalSelect
                id="db-query-logging"
                label="Query Logging"
                value={queryLogging}
                options={TOGGLE_OPTIONS}
                onChange={(val) => setQueryLogging(val)}
              />
              <div className="fci-fieldbox">
                <label htmlFor="db-conn-limit" className="fci-box-label">Connection Limit</label>
                <TerminalInput
                  id="db-conn-limit"
                  type="number"
                  value={connectionLimit}
                  onChange={(e) => setConnectionLimit(e.target.value)}
                  placeholder="100"
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
