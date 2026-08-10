import { useState } from 'react'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useCreateVm } from '@/features/vm/hooks'
import type { CreateVmInput } from '@/features/vm/types'

const OS_OPTIONS = ['Ubuntu 22.04', 'Ubuntu 24.04', 'Debian 12', 'AlmaLinux 9']
const CPU_OPTIONS = ['1', '2', '4', '8', '16', '32']
const MEMORY_OPTIONS = ['1', '2', '4', '8', '16', '32', '64']
const PROVISIONING_MODEL_OPTIONS = ['Standard', 'Dedicated']
const DATA_PROTECTION_OPTIONS = ['Yes', 'No']
const NETWORKING_OPTIONS = ['Default VPC', 'Public Network', 'Private Network', 'Custom VPC']

type FormState = {
  name: string
  cpu: string
  memory: string
  disk: string
  os: string
  provisioningModel: string
  dataProtection: string
  networking: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const INITIAL_STATE: FormState = {
  name: '',
  cpu: CPU_OPTIONS[0],
  memory: MEMORY_OPTIONS[0],
  disk: '',
  os: OS_OPTIONS[0],
  provisioningModel: PROVISIONING_MODEL_OPTIONS[0],
  dataProtection: DATA_PROTECTION_OPTIONS[0],
  networking: NETWORKING_OPTIONS[0],
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!form.name.trim()) {
    errors.name = 'Name is required'
  }

  const rawDisk = form.disk
  if (!rawDisk.trim()) {
    errors.disk = 'Required'
  } else if (!(Number(rawDisk) > 0)) {
    errors.disk = 'Must be a positive number'
  }

  return errors
}

export function VmCreateForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const createVm = useCreateVm()

  function updateField<K extends keyof FormState>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    // Provisioning Model, Data Protection, and Networking are UI-only for now —
    // CreateVmInput (PR #7's data layer) doesn't have fields for them yet.
    const input: CreateVmInput = {
      name: form.name.trim(),
      cpu: Number(form.cpu),
      memory: Number(form.memory),
      disk: Number(form.disk),
      os: form.os,
    }

    createVm.mutate(input, {
      onSuccess: () => {
        setShowSuccess(true)
        onSuccess()
      },
    })
  }

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Create VM</div>
      <button
        type="button"
        className="fci-linkbtn fci-action-back fci-box-key-top"
        onClick={onCancel}
        aria-label="Back"
        title="Back"
      >
        &lt;&lt;
      </button>

      <div className="fci-split-layout" style={{ marginTop: 14 }}>
        <div className="fci-split-fields">
          <form onSubmit={handleSubmit} noValidate>
            <div className="fci-fieldbox">
              <label htmlFor="vm-create-name" className="fci-box-label">Name</label>
              <TerminalInput
                id="vm-create-name"
                type="text"
                hasError={Boolean(errors.name)}
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
              {errors.name && <div className="fci-form-error">{errors.name}</div>}
            </div>

            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="vm-create-cpu" className="fci-box-label">CPU (cores)</label>
                <TerminalSelect
                  id="vm-create-cpu"
                  value={form.cpu}
                  options={CPU_OPTIONS}
                  onChange={(value) => updateField('cpu', value)}
                />
              </div>
              <div className="fci-fieldbox">
                <label htmlFor="vm-create-memory" className="fci-box-label">Memory (GB)</label>
                <TerminalSelect
                  id="vm-create-memory"
                  value={form.memory}
                  options={MEMORY_OPTIONS}
                  onChange={(value) => updateField('memory', value)}
                />
              </div>
            </div>

            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="vm-create-disk" className="fci-box-label">Disk (GB)</label>
                <TerminalInput
                  id="vm-create-disk"
                  type="number"
                  hasError={Boolean(errors.disk)}
                  value={form.disk}
                  onChange={(e) => updateField('disk', e.target.value)}
                />
                {errors.disk && <div className="fci-form-error">{errors.disk}</div>}
              </div>
              <div className="fci-fieldbox">
                <label htmlFor="vm-create-os" className="fci-box-label">OS</label>
                <TerminalSelect
                  id="vm-create-os"
                  value={form.os}
                  options={OS_OPTIONS}
                  onChange={(value) => updateField('os', value)}
                />
              </div>
            </div>

            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="vm-create-provisioning-model" className="fci-box-label">Provisioning Model</label>
                <TerminalSelect
                  id="vm-create-provisioning-model"
                  value={form.provisioningModel}
                  options={PROVISIONING_MODEL_OPTIONS}
                  onChange={(value) => updateField('provisioningModel', value)}
                />
              </div>
              <div className="fci-fieldbox">
                <label htmlFor="vm-create-data-protection" className="fci-box-label">Data Protection</label>
                <TerminalSelect
                  id="vm-create-data-protection"
                  value={form.dataProtection}
                  options={DATA_PROTECTION_OPTIONS}
                  onChange={(value) => updateField('dataProtection', value)}
                />
              </div>
            </div>

            <div className="fci-fieldbox">
              <label htmlFor="vm-create-networking" className="fci-box-label">Networking</label>
              <TerminalSelect
                id="vm-create-networking"
                value={form.networking}
                options={NETWORKING_OPTIONS}
                onChange={(value) => updateField('networking', value)}
              />
            </div>

            {createVm.isError && (
              <div className="fci-form-error" style={{ marginBottom: 14 }}>
                {createVm.error instanceof Error ? createVm.error.message : 'Failed to create VM'}
              </div>
            )}

            {showSuccess && (
              <div style={{ color: '#7ec87e', fontSize: 12, marginBottom: 14 }}>VM created successfully</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                className="fci-linkbtn fci-action-add"
                style={{ padding: '6px 14px' }}
                disabled={createVm.isPending}
              >
                {createVm.isPending ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                className="fci-linkbtn fci-action-edit"
                style={{ padding: '6px 14px' }}
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="fci-split-info">
          <h3>About VM Creation</h3>
          <p>Provisions a new virtual machine in the current project. The instance boots automatically once created.</p>
          <p>CPU and memory are allocated as dedicated cores/GB — no oversubscription. Disk size can be increased later but not decreased.</p>
          <p>Choose an OS image below; SSH key-based access is configured automatically for the default user.</p>
        </div>
      </div>
    </div>
  )
}
