import { useState } from 'react'
import { useCreateVm } from '@/features/vm/hooks'
import type { CreateVmInput } from '@/features/vm/types'

const OS_OPTIONS = ['Ubuntu 22.04', 'Ubuntu 24.04', 'Debian 12', 'AlmaLinux 9']

type FormState = {
  name: string
  cpu: string
  memory: string
  disk: string
  os: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const INITIAL_STATE: FormState = {
  name: '',
  cpu: '',
  memory: '',
  disk: '',
  os: OS_OPTIONS[0],
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!form.name.trim()) {
    errors.name = 'Name is required'
  }

  for (const field of ['cpu', 'memory', 'disk'] as const) {
    const raw = form[field]
    if (!raw.trim()) {
      errors[field] = 'Required'
    } else if (!(Number(raw) > 0)) {
      errors[field] = 'Must be a positive number'
    }
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
    <div className="fci-detail-panel" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
        Create VM
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="fci-fieldbox">
          <label htmlFor="vm-create-name" className="fci-box-label">Name</label>
          <input
            id="vm-create-name"
            type="text"
            className={errors.name ? 'fci-form-input-error' : ''}
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
          {errors.name && <div className="fci-form-error">{errors.name}</div>}
        </div>

        <div className="fci-fieldrow">
          <div className="fci-fieldbox">
            <label htmlFor="vm-create-cpu" className="fci-box-label">CPU (cores)</label>
            <input
              id="vm-create-cpu"
              type="number"
              className={errors.cpu ? 'fci-form-input-error' : ''}
              value={form.cpu}
              onChange={(e) => updateField('cpu', e.target.value)}
            />
            {errors.cpu && <div className="fci-form-error">{errors.cpu}</div>}
          </div>
          <div className="fci-fieldbox">
            <label htmlFor="vm-create-memory" className="fci-box-label">Memory (GB)</label>
            <input
              id="vm-create-memory"
              type="number"
              className={errors.memory ? 'fci-form-input-error' : ''}
              value={form.memory}
              onChange={(e) => updateField('memory', e.target.value)}
            />
            {errors.memory && <div className="fci-form-error">{errors.memory}</div>}
          </div>
        </div>

        <div className="fci-fieldrow">
          <div className="fci-fieldbox">
            <label htmlFor="vm-create-disk" className="fci-box-label">Disk (GB)</label>
            <input
              id="vm-create-disk"
              type="number"
              className={errors.disk ? 'fci-form-input-error' : ''}
              value={form.disk}
              onChange={(e) => updateField('disk', e.target.value)}
            />
            {errors.disk && <div className="fci-form-error">{errors.disk}</div>}
          </div>
          <div className="fci-fieldbox">
            <label htmlFor="vm-create-os" className="fci-box-label">OS</label>
            <select id="vm-create-os" value={form.os} onChange={(e) => updateField('os', e.target.value)}>
              {OS_OPTIONS.map((os) => (
                <option key={os} value={os}>
                  {os}
                </option>
              ))}
            </select>
          </div>
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
  )
}
