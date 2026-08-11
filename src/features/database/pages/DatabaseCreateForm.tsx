import { useState } from 'react'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useCreateDatabase } from '@/features/database/hooks'
import { useDatabaseStore, type DatabaseCreateFormState } from '@/features/database/store'
import type { CreateDatabaseInput, DatabaseEngine } from '@/features/database/types'

const ENGINE_OPTIONS = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'redis', label: 'Redis' },
]
const ENGINE_VERSIONS: Record<DatabaseEngine, string[]> = {
  postgres: ['14.10', '15.5', '16.1'],
  mysql: ['5.7', '8.0.35', '8.0.36'],
  redis: ['6.2', '7.0', '7.2'],
}
const REGION_OPTIONS = ['ANK', 'IST']
const CPU_OPTIONS = ['1', '2', '4', '8']
const MEMORY_OPTIONS = ['1', '2', '4', '8', '16', '32']

type FormErrors = Partial<Record<keyof DatabaseCreateFormState, string>>

function validate(form: DatabaseCreateFormState): FormErrors {
  const errors: FormErrors = {}

  if (!form.name.trim()) {
    errors.name = 'Name is required'
  }

  const rawStorageSize = form.storageSize
  if (!rawStorageSize.trim()) {
    errors.storageSize = 'Required'
  } else if (!(Number(rawStorageSize) > 0)) {
    errors.storageSize = 'Must be a positive number'
  }

  return errors
}

export function DatabaseCreateForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const form = useDatabaseStore((state) => state.createForm)
  const setFormField = useDatabaseStore((state) => state.setCreateFormField)
  const updateEngineState = useDatabaseStore((state) => state.updateCreateEngine)
  const resetForm = useDatabaseStore((state) => state.resetCreateForm)

  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const createDatabase = useCreateDatabase()

  function updateEngine(value: string) {
    const engine = value as DatabaseEngine
    updateEngineState(engine, ENGINE_VERSIONS[engine][0])
  }

  function handleCancel() {
    resetForm()
    onCancel()
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const input: CreateDatabaseInput = {
      name: form.name.trim(),
      region: form.region,
      engine: form.engine,
      version: form.version,
      storageSize: Number(form.storageSize),
      cpu: Number(form.cpu),
      memory: Number(form.memory),
    }

    createDatabase.mutate(input, {
      onSuccess: () => {
        setShowSuccess(true)
        resetForm()
        onSuccess()
      },
    })
  }

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Create Database</div>
      <button
        type="button"
        className="fci-linkbtn fci-action-back fci-box-key-top"
        onClick={handleCancel}
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
                <label htmlFor="db-create-name" className="fci-box-label">Name</label>
                <TerminalInput
                  id="db-create-name"
                  type="text"
                  hasError={Boolean(errors.name)}
                  value={form.name}
                  onChange={(e) => setFormField('name', e.target.value)}
                />
                {errors.name && <div className="fci-form-error">{errors.name}</div>}
              </div>
              <TerminalSelect
                id="db-create-region"
                label="Region"
                value={form.region}
                options={REGION_OPTIONS}
                onChange={(value) => setFormField('region', value as 'ANK' | 'IST')}
              />
            </div>

            <div className="fci-fieldrow">
              <TerminalSelect
                id="db-create-engine"
                label="Engine"
                value={form.engine}
                options={ENGINE_OPTIONS}
                onChange={updateEngine}
              />
              <TerminalSelect
                id="db-create-version"
                label="Version"
                value={form.version}
                options={ENGINE_VERSIONS[form.engine]}
                onChange={(value) => setFormField('version', value)}
              />
            </div>

            <div className="fci-fieldrow">
              <TerminalSelect
                id="db-create-cpu"
                label="CPU (cores)"
                value={form.cpu}
                options={CPU_OPTIONS}
                onChange={(value) => setFormField('cpu', value)}
              />
              <TerminalSelect
                id="db-create-memory"
                label="Memory (GB)"
                value={form.memory}
                options={MEMORY_OPTIONS}
                onChange={(value) => setFormField('memory', value)}
              />
            </div>

            <div className="fci-fieldbox">
              <label htmlFor="db-create-storage" className="fci-box-label">Storage Size (GB)</label>
              <TerminalInput
                id="db-create-storage"
                type="number"
                hasError={Boolean(errors.storageSize)}
                value={form.storageSize}
                onChange={(e) => setFormField('storageSize', e.target.value)}
              />
              {errors.storageSize && <div className="fci-form-error">{errors.storageSize}</div>}
            </div>

            {createDatabase.isError && (
              <div className="fci-form-error" style={{ marginBottom: 14 }}>
                {createDatabase.error instanceof Error ? createDatabase.error.message : 'Failed to create database'}
              </div>
            )}

            {showSuccess && (
              <div style={{ color: '#7ec87e', fontSize: 12, marginBottom: 14 }}>Database created successfully</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                className="fci-linkbtn fci-action-add"
                style={{ padding: '6px 14px' }}
                disabled={createDatabase.isPending}
              >
                {createDatabase.isPending ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                className="fci-linkbtn fci-action-edit"
                style={{ padding: '6px 14px' }}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="fci-split-info">
          <h3>About Database Creation</h3>
          <p>Provisions a new managed database instance in the current project. The instance starts in a pending state and becomes available shortly after creation.</p>
          <p>CPU, memory, and storage are allocated as dedicated resources. Storage size can be increased later but not decreased.</p>
          <p>Choose an engine and version below; connection credentials are generated automatically for the default application user.</p>
        </div>
      </div>
    </div>
  )
}
