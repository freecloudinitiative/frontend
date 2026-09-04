import { useState } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useCreateBucket } from '@/features/storage/hooks'
import type { BucketAccess, CreateBucketInput } from '@/features/storage/types'
import { useEntityForm } from '@/lib/useEntityForm'
import { BUCKET_CONSTRAINTS } from '@/lib/apiConstraints'

const REGION_OPTIONS = [
  { value: 'IST' },
  { value: 'ANK', disabled: true },
]
const ACCESS_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'public-read', label: 'Public read' },
  { value: 'public-read-write', label: 'Public read/write' },
]

const BUCKET_NAME_PATTERN = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/

const PUBLIC_READ_WRITE = 'public-read-write'

interface FormState {
  bucketName: string
  region: string
  access: BucketAccess
  confirmPublic: boolean
  capacityGb: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  const name = form.bucketName.trim()
  if (!name) {
    errors.bucketName = 'Bucket name is required'
  } else if (name.length < 3 || name.length > 63) {
    errors.bucketName = 'Bucket name must be 3-63 characters'
  } else if (!BUCKET_NAME_PATTERN.test(name)) {
    errors.bucketName = 'Bucket name must be lowercase, no spaces (letters, numbers, dots, hyphens)'
  }
  // The API refuses public-read-write without an explicit acknowledgement.
  // Catch it here so the choice is explained where it is made, rather than
  // coming back as an opaque failed create.
  if (form.access === PUBLIC_READ_WRITE && !form.confirmPublic) {
    errors.confirmPublic = 'Confirm that anyone will be able to write to this bucket'
  }
  const capacityGb = Number(form.capacityGb)
  if (!Number.isInteger(capacityGb) || capacityGb < BUCKET_CONSTRAINTS.capacityGb.min) {
    errors.capacityGb = 'Bucket storage capacity must be at least 1 GB'
  } else if (capacityGb > BUCKET_CONSTRAINTS.capacityGb.max) {
    errors.capacityGb = 'Bucket storage capacity cannot exceed 5 GB'
  }
  return errors
}

const INITIAL_FORM_STATE: FormState = { bucketName: '', region: 'IST', access: 'private', confirmPublic: false, capacityGb: '5' }

export function BucketCreateForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE)
  const createBucket = useCreateBucket()

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const { errors, handleCancel, handleSubmit } = useEntityForm<FormState, FormErrors, CreateBucketInput>({
    form,
    resetForm: () => setForm(INITIAL_FORM_STATE),
    validate,
    buildInput: (form) => ({
      bucketName: form.bucketName.trim(),
      region: form.region,
      access: form.access,
      capacityGb: Number(form.capacityGb),
      ...(form.access === PUBLIC_READ_WRITE ? { confirmPublic: true } : {}),
    }),
    mutate: createBucket.mutate,
    successMessage: 'Bucket created successfully',
    logLabel: 'BucketCreateForm submit',
    onCancel,
    onSuccess,
  })

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Create Bucket</div>
      <IconButton variant="back" placement="notch" onClick={handleCancel} title="Back" ariaLabel="Back" />

      <div className="fci-split-layout" style={{ marginTop: 14 }}>
        <div className="fci-split-fields">
          <form onSubmit={handleSubmit} noValidate>
            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="bucket-create-name" className="fci-box-label">Bucket Name</label>
                <TerminalInput
                  id="bucket-create-name"
                  type="text"
                  hasError={Boolean(errors.bucketName)}
                  value={form.bucketName}
                  onChange={(e) => setField('bucketName', e.target.value)}
                />
                {errors.bucketName && <div className="fci-form-error">{errors.bucketName}</div>}
              </div>
              <TerminalSelect
                id="bucket-create-region"
                label="Region"
                value={form.region}
                options={REGION_OPTIONS}
                onChange={(value) => setField('region', value)}
              />
            </div>

            <TerminalSelect
              id="bucket-create-access"
              label="Access"
              value={form.access}
              options={ACCESS_OPTIONS}
              onChange={(value) => {
                setField('access', value as BucketAccess)
                if (value !== PUBLIC_READ_WRITE) setField('confirmPublic', false)
              }}
            />

            <div className="fci-fieldbox" style={{ marginTop: 10 }}>
              <label htmlFor="bucket-create-capacity" className="fci-box-label">Storage Capacity (GB)</label>
              <TerminalInput
                id="bucket-create-capacity"
                type="number"
                min={BUCKET_CONSTRAINTS.capacityGb.min}
                max={BUCKET_CONSTRAINTS.capacityGb.max}
                step={1}
                hasError={Boolean(errors.capacityGb)}
                value={form.capacityGb}
                onChange={(event) => setField('capacityGb', event.target.value)}
              />
              {errors.capacityGb && <div className="fci-form-error">{errors.capacityGb}</div>}
              <p className="fci-field-help">Maximum 5 GB per bucket for every access type.</p>
            </div>

            {form.access === PUBLIC_READ_WRITE && (
              <div className="fci-fieldbox" style={{ marginTop: 10 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={form.confirmPublic}
                    onChange={(event) => setField('confirmPublic', event.target.checked)}
                    aria-label="Confirm public read/write"
                  />
                  {' '}I understand anyone will be able to read and write objects in this bucket
                </label>
                {errors.confirmPublic && <div className="fci-form-error">{errors.confirmPublic}</div>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                type="submit"
                className="fci-linkbtn fci-action-add"
                style={{ padding: '6px 14px' }}
                disabled={createBucket.isPending}
              >
                {createBucket.isPending ? 'Creating…' : 'Create'}
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
          <h3>About Bucket Creation</h3>
          <p>Provisions a new storage bucket in the current project. Buckets are created empty and start accepting objects immediately.</p>
          <p>Bucket names must be lowercase and contain no spaces — only letters, numbers, dots, and hyphens.</p>
          <p>Access level controls who can read or write objects. Private buckets are only accessible with valid credentials.</p>
          <p>Each bucket has a strict storage capacity of up to 5 GB.</p>
          <p>Public read/write needs an explicit confirmation: it lets anyone on the network both read and overwrite objects in the bucket.</p>
        </div>
      </div>
    </div>
  )
}
