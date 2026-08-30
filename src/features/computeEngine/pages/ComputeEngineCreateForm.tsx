import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useCreateComputeEngine } from '@/features/computeEngine/hooks'
import { COMPUTE_ENGINE_OS_OPTIONS } from '@/features/computeEngine/constants'
import { useComputeEngineStore, type ComputeEngineCreateFormState } from '@/features/computeEngine/store'
import type { CreateComputeEngineInput, Region } from '@/features/computeEngine/types'
import { COMPUTE_ENGINE_CONSTRAINTS } from '@/lib/apiConstraints'
import { useEntityForm } from '@/lib/useEntityForm'
import { gibToMib } from '@/lib/units'

const REGION_OPTIONS = [
  { value: 'IST', label: 'IST' },
  { value: 'ANK', label: 'ANK', disabled: true },
]
const CPU_OPTIONS = ['1', '2', '4', '8', '16']
const MEMORY_OPTIONS = ['0.5', '1', '2', '4']
const PROVISIONING_MODEL_OPTIONS = [
  { value: 'Standard', label: 'Standard' },
  { value: 'Dedicated', label: 'Dedicated', disabled: true },
]
const DATA_PROTECTION_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes', disabled: true },
]
const NETWORKING_OPTIONS = ['Default VPC', 'Public Network', 'Private Network', 'Custom VPC']

type FormErrors = Partial<Record<keyof ComputeEngineCreateFormState, string>>

function validate(form: ComputeEngineCreateFormState): FormErrors {
  const errors: FormErrors = {}

  if (!form.name.trim()) {
    errors.name = 'Name is required'
  }

  const rawDisk = form.disk
  if (!rawDisk.trim()) {
    errors.disk = 'Required'
  } else if (!(Number(rawDisk) > 0)) {
    errors.disk = 'Must be a positive number'
  } else if (
    Number(rawDisk) < COMPUTE_ENGINE_CONSTRAINTS.diskGib.min
    || Number(rawDisk) > COMPUTE_ENGINE_CONSTRAINTS.diskGib.max
  ) {
    errors.disk = `Must be between ${COMPUTE_ENGINE_CONSTRAINTS.diskGib.min} and ${COMPUTE_ENGINE_CONSTRAINTS.diskGib.max} GB`
  }

  return errors
}

export function ComputeEngineCreateForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const form = useComputeEngineStore((state) => state.createForm)
  const setFormField = useComputeEngineStore((state) => state.setCreateFormField)
  const resetForm = useComputeEngineStore((state) => state.resetCreateForm)

  const createComputeEngine = useCreateComputeEngine()

  const { errors, handleCancel, handleSubmit } = useEntityForm<
    ComputeEngineCreateFormState,
    FormErrors,
    CreateComputeEngineInput
  >({
    form,
    resetForm,
    validate,
    buildInput: (form) => ({
      name: form.name.trim(),
      region: form.region,
      cpu: Number(form.cpu),
      memory: gibToMib(Number(form.memory)),
      disk: Number(form.disk),
      os: form.os,
    }),
    mutate: createComputeEngine.mutate,
    successMessage: 'Compute Engine created successfully',
    logLabel: 'ComputeEngineCreateForm submit',
    onCancel,
    onSuccess,
  })

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Create Compute Engine</div>
      <IconButton variant="back" placement="notch" onClick={handleCancel} title="Back" ariaLabel="Back" />

      <div className="fci-split-layout" style={{ marginTop: 14 }}>
        <div className="fci-split-fields">
          <form onSubmit={handleSubmit} noValidate>
            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="ce-create-name" className="fci-box-label">Name</label>
                <TerminalInput
                  id="ce-create-name"
                  type="text"
                  hasError={Boolean(errors.name)}
                  value={form.name}
                  onChange={(e) => setFormField('name', e.target.value)}
                />
                {errors.name && <div className="fci-form-error">{errors.name}</div>}
              </div>
              <TerminalSelect
                id="ce-create-region"
                label="Region"
                value={form.region}
                options={REGION_OPTIONS}
                onChange={(value) => setFormField('region', value as Region)}
              />
            </div>

            <div className="fci-fieldrow">
              <TerminalSelect
                id="ce-create-cpu"
                label="vCPU (cores)"
                value={form.cpu}
                options={CPU_OPTIONS}
                onChange={(value) => setFormField('cpu', value)}
              />
              <TerminalSelect
                id="ce-create-memory"
                label="Memory (GB)"
                value={form.memory}
                options={MEMORY_OPTIONS}
                onChange={(value) => setFormField('memory', value)}
              />
            </div>

            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="ce-create-disk" className="fci-box-label">Disk (GB)</label>
                <TerminalInput
                  id="ce-create-disk"
                  type="text"
                  inputMode="decimal"
                  min={COMPUTE_ENGINE_CONSTRAINTS.diskGib.min}
                  max={COMPUTE_ENGINE_CONSTRAINTS.diskGib.max}
                  hasError={Boolean(errors.disk)}
                  value={form.disk}
                  onChange={(e) => setFormField('disk', e.target.value)}
                />
                {errors.disk && <div className="fci-form-error">{errors.disk}</div>}
              </div>
              <TerminalSelect
                id="ce-create-os"
                label="OS"
                value={form.os}
                options={COMPUTE_ENGINE_OS_OPTIONS}
                onChange={(value) => setFormField('os', value)}
              />
            </div>

            <div className="fci-fieldrow">
              <TerminalSelect
                id="ce-create-provisioning-model"
                label="Provisioning Model"
                value={form.provisioningModel}
                options={PROVISIONING_MODEL_OPTIONS}
                onChange={(value) => setFormField('provisioningModel', value)}
              />
              <TerminalSelect
                id="ce-create-data-protection"
                label="Data Protection"
                value={form.dataProtection}
                options={DATA_PROTECTION_OPTIONS}
                onChange={(value) => setFormField('dataProtection', value)}
              />
            </div>

            <div className="fci-fieldrow">
              <TerminalSelect
                id="ce-create-networking"
                label="Networking"
                value={form.networking}
                options={NETWORKING_OPTIONS}
                onChange={(value) => setFormField('networking', value)}
              />
              <TerminalSelect
                id="ce-create-time-to-live"
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
                disabled={createComputeEngine.isPending}
              >
                {createComputeEngine.isPending ? 'Creating…' : 'Create'}
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
          <h3>About Compute Engine Creation</h3>
          <p>Provisions a new virtual machine in the current project. The instance boots automatically once created.</p>
          <p>vCPU and memory are allocated as dedicated cores/GB — no oversubscription.</p>
          <p>Enter the disk size you need, up to a maximum of {COMPUTE_ENGINE_CONSTRAINTS.diskGib.max} GB. Disk size can be increased later but not decreased.</p>
          <p>Choose an OS image below. Use the Console tab to open the browser terminal once the instance is running.</p>
        </div>
      </div>
    </div>
  )
}
