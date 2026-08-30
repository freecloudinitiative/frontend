import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useCreateDatabase } from '@/features/database/hooks'
import { useDatabaseStore, type DatabaseCreateFormState } from '@/features/database/store'
import type { CreateDatabaseInput, DatabaseEngine } from '@/features/database/types'
import { DATABASE_CPU_OPTIONS, DATABASE_MEMORY_OPTIONS } from '@/features/database/options'
import { DATABASE_CONSTRAINTS } from '@/lib/apiConstraints'
import { useEntityForm } from '@/lib/useEntityForm'
import { gibToMib } from '@/lib/units'

const ENGINE_OPTIONS = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL', disabled: true },
  { value: 'redis', label: 'Redis', disabled: true },
  { value: 'valkey', label: 'Valkey', disabled: true },
  { value: 'sqlite', label: 'SQLite', disabled: true },
]
const ENGINE_VERSIONS: Record<DatabaseEngine, string[]> = {
  // Source of truth: database-service/internal/projection/versions.go
  postgres: ['17', '16'],
  mysql: ['5.7', '8.0.35', '8.0.36'],
  redis: ['6.2', '7.0', '7.2'],
  valkey: ['7.2', '8.0'],
  sqlite: ['3'],
}
const REGION_OPTIONS = [
  { value: 'IST', label: 'IST' },
  { value: 'ANK', label: 'ANK', disabled: true },
]
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
  } else if (
    Number(rawStorageSize) < DATABASE_CONSTRAINTS.storageSize.min
    || Number(rawStorageSize) > DATABASE_CONSTRAINTS.storageSize.max
  ) {
    errors.storageSize = `Must be between ${DATABASE_CONSTRAINTS.storageSize.min} and ${DATABASE_CONSTRAINTS.storageSize.max} GB`
  }

  return errors
}

export function DatabaseCreateForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const form = useDatabaseStore((state) => state.createForm)
  const setFormField = useDatabaseStore((state) => state.setCreateFormField)
  const updateEngineState = useDatabaseStore((state) => state.updateCreateEngine)
  const resetForm = useDatabaseStore((state) => state.resetCreateForm)

  const createDatabase = useCreateDatabase()

  function updateEngine(value: string) {
    const engine = value as DatabaseEngine
    updateEngineState(engine, ENGINE_VERSIONS[engine][0])
  }

  const { errors, handleCancel, handleSubmit } = useEntityForm<
    DatabaseCreateFormState,
    FormErrors,
    CreateDatabaseInput
  >({
    form,
    resetForm,
    validate,
    buildInput: (form) => ({
      name: form.name.trim(),
      region: form.region,
      engine: form.engine,
      version: form.version,
      storageSize: Number(form.storageSize),
      cpu: Number(form.cpu),
      memory: gibToMib(Number(form.memory)),
    }),
    mutate: createDatabase.mutate,
    successMessage: 'Database created successfully',
    logLabel: 'DatabaseCreateForm submit',
    onCancel,
    onSuccess,
  })

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Create Database</div>
      <IconButton variant="back" placement="notch" onClick={handleCancel} title="Back" ariaLabel="Back" />

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
                label="vCPU (cores)"
                value={form.cpu}
                options={DATABASE_CPU_OPTIONS}
                onChange={(value) => setFormField('cpu', value)}
              />
              <TerminalSelect
                id="db-create-memory"
                label="Memory (GB)"
                value={form.memory}
                options={DATABASE_MEMORY_OPTIONS}
                onChange={(value) => setFormField('memory', value)}
              />
            </div>

            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="db-create-storage" className="fci-box-label">Storage Size (GB)</label>
                <TerminalInput
                  id="db-create-storage"
                  type="text"
                  inputMode="decimal"
                  min={DATABASE_CONSTRAINTS.storageSize.min}
                  max={DATABASE_CONSTRAINTS.storageSize.max}
                  hasError={Boolean(errors.storageSize)}
                  value={form.storageSize}
                  onChange={(e) => setFormField('storageSize', e.target.value)}
                />
                {errors.storageSize && <div className="fci-form-error">{errors.storageSize}</div>}
              </div>
              <TerminalSelect
                id="db-create-time-to-live"
                label="Time to Live"
                value="Coming soon"
                options={['Coming soon']}
                onChange={() => {}}
                disabled
              />
            </div>


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
          <p>vCPU, memory, and storage are allocated as dedicated resources. Storage size can be a maximum of {DATABASE_CONSTRAINTS.storageSize.max} GB and can be increased later but not decreased.</p>
          <p>Choose an engine and version below; connection credentials are generated automatically for the default application user.</p>
        </div>
      </div>
    </div>
  )
}
