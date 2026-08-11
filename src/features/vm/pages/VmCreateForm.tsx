import { useState } from 'react'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useCreateVm } from '@/features/vm/hooks'
import { useVmStore, type VmCreateFormState } from '@/features/vm/store'
import type { CreateVmInput, Region } from '@/features/vm/types'
import { useToastStore } from '@/store/toastStore'

const OS_OPTIONS = ['Ubuntu 22.04', 'Ubuntu 24.04', 'Debian 12', 'AlmaLinux 9']
const REGION_OPTIONS = ['ANK', 'IST']
const CPU_OPTIONS = ['1', '2', '4', '8', '16', '32']
const MEMORY_OPTIONS = ['1', '2', '4', '8', '16', '32', '64']
const PROVISIONING_MODEL_OPTIONS = ['Standard', 'Dedicated']
const DATA_PROTECTION_OPTIONS = ['Yes', 'No']
const NETWORKING_OPTIONS = ['Default VPC', 'Public Network', 'Private Network', 'Custom VPC']

type FormErrors = Partial<Record<keyof VmCreateFormState, string>>

function validate(form: VmCreateFormState): FormErrors {
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
  const form = useVmStore((state) => state.createForm)
  const setFormField = useVmStore((state) => state.setCreateFormField)
  const resetForm = useVmStore((state) => state.resetCreateForm)

  const [errors, setErrors] = useState<FormErrors>({})
  const createVm = useCreateVm()
  const addToast = useToastStore((state) => state.addToast)

  function handleCancel() {
    resetForm()
    onCancel()
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const input: CreateVmInput = {
      name: form.name.trim(),
      region: form.region,
      cpu: Number(form.cpu),
      memory: Number(form.memory),
      disk: Number(form.disk),
      os: form.os,
    }

    createVm.mutate(input, {
      onSuccess: () => {
        resetForm()
        addToast('VM created successfully', 'success')
        onSuccess()
      },
      onError: (error) => {
        console.error('[VmCreateForm submit]', error)
        addToast('Operation failed', 'error')
      },
    })
  }

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Create VM</div>
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
                <label htmlFor="vm-create-name" className="fci-box-label">Name</label>
                <TerminalInput
                  id="vm-create-name"
                  type="text"
                  hasError={Boolean(errors.name)}
                  value={form.name}
                  onChange={(e) => setFormField('name', e.target.value)}
                />
                {errors.name && <div className="fci-form-error">{errors.name}</div>}
              </div>
              <TerminalSelect
                id="vm-create-region"
                label="Region"
                value={form.region}
                options={REGION_OPTIONS}
                onChange={(value) => setFormField('region', value as Region)}
              />
            </div>

            <div className="fci-fieldrow">
              <TerminalSelect
                id="vm-create-cpu"
                label="CPU (cores)"
                value={form.cpu}
                options={CPU_OPTIONS}
                onChange={(value) => setFormField('cpu', value)}
              />
              <TerminalSelect
                id="vm-create-memory"
                label="Memory (GB)"
                value={form.memory}
                options={MEMORY_OPTIONS}
                onChange={(value) => setFormField('memory', value)}
              />
            </div>

            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="vm-create-disk" className="fci-box-label">Disk (GB)</label>
                <TerminalInput
                  id="vm-create-disk"
                  type="number"
                  hasError={Boolean(errors.disk)}
                  value={form.disk}
                  onChange={(e) => setFormField('disk', e.target.value)}
                />
                {errors.disk && <div className="fci-form-error">{errors.disk}</div>}
              </div>
              <TerminalSelect
                id="vm-create-os"
                label="OS"
                value={form.os}
                options={OS_OPTIONS}
                onChange={(value) => setFormField('os', value)}
              />
            </div>

            <div className="fci-fieldrow">
              <TerminalSelect
                id="vm-create-provisioning-model"
                label="Provisioning Model"
                value={form.provisioningModel}
                options={PROVISIONING_MODEL_OPTIONS}
                onChange={(value) => setFormField('provisioningModel', value)}
              />
              <TerminalSelect
                id="vm-create-data-protection"
                label="Data Protection"
                value={form.dataProtection}
                options={DATA_PROTECTION_OPTIONS}
                onChange={(value) => setFormField('dataProtection', value)}
              />
            </div>

            <TerminalSelect
              id="vm-create-networking"
              label="Networking"
              value={form.networking}
              options={NETWORKING_OPTIONS}
              onChange={(value) => setFormField('networking', value)}
            />


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
                onClick={handleCancel}
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
