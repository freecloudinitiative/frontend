import { useState } from 'react'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useCreateBucket } from '@/features/storage/hooks'
import type { BucketAccess, CreateBucketInput } from '@/features/storage/types'
import { useEntityForm } from '@/lib/useEntityForm'

const REGION_OPTIONS = ['ANK', 'IST']
const ACCESS_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'public-read', label: 'Public read' },
  { value: 'public-read-write', label: 'Public read/write' },
]

const BUCKET_NAME_PATTERN = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/

interface FormState {
  bucketName: string
  region: string
  access: BucketAccess
}

type FormErrors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  const name = form.bucketName.trim()
  if (!name) {
    errors.bucketName = 'Bucket name is required'
  } else if (!BUCKET_NAME_PATTERN.test(name)) {
    errors.bucketName = 'Bucket name must be lowercase, no spaces (letters, numbers, dots, hyphens)'
  }
  return errors
}

const INITIAL_FORM_STATE: FormState = { bucketName: '', region: 'ANK', access: 'private' }

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
              onChange={(value) => setField('access', value as BucketAccess)}
            />


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
        </div>
      </div>
    </div>
  )
}
