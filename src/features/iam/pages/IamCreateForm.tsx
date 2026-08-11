import { useState } from 'react'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useCreateIamUser } from '@/features/iam/hooks'
import type { CreateIamUserInput, IamUserRole } from '@/features/iam/types'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'auditor', label: 'Auditor' },
]

interface FormState {
  name: string
  email: string
  role: IamUserRole
}

type FormErrors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) {
    errors.name = 'Name is required'
  }
  if (!form.email.trim()) {
    errors.email = 'Email is required'
  } else if (!form.email.includes('@')) {
    errors.email = 'Email must contain "@"'
  }
  return errors
}

const DEFAULT_FORM: FormState = {
  name: '',
  email: '',
  role: 'viewer',
}

export function IamCreateForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const createIamUser = useCreateIamUser()

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleCancel() {
    setForm(DEFAULT_FORM)
    setErrors({})
    onCancel()
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const input: CreateIamUserInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
    }

    createIamUser.mutate(input, {
      onSuccess: () => {
        setShowSuccess(true)
        setForm(DEFAULT_FORM)
        setErrors({})
        onSuccess()
      },
    })
  }

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Create IAM User</div>
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
                <label htmlFor="iam-create-name" className="fci-box-label">
                  Name
                </label>
                <TerminalInput
                  id="iam-create-name"
                  type="text"
                  hasError={Boolean(errors.name)}
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
                {errors.name && <div className="fci-form-error">{errors.name}</div>}
              </div>

              <div className="fci-fieldbox">
                <label htmlFor="iam-create-email" className="fci-box-label">
                  Email
                </label>
                <TerminalInput
                  id="iam-create-email"
                  type="text"
                  hasError={Boolean(errors.email)}
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
                {errors.email && <div className="fci-form-error">{errors.email}</div>}
              </div>
            </div>

            <TerminalSelect
              id="iam-create-role"
              label="Role"
              value={form.role}
              options={ROLE_OPTIONS}
              onChange={(value) => setField('role', value as IamUserRole)}
            />

            {createIamUser.isError && (
              <div className="fci-form-error" style={{ marginBottom: 14 }}>
                {createIamUser.error instanceof Error
                  ? createIamUser.error.message
                  : 'Failed to create IAM user'}
              </div>
            )}

            {showSuccess && (
              <div style={{ color: '#7ec87e', fontSize: 12, marginBottom: 14 }}>
                IAM user created successfully
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                type="submit"
                className="fci-linkbtn fci-action-add"
                style={{ padding: '6px 14px' }}
                disabled={createIamUser.isPending}
              >
                {createIamUser.isPending ? 'Creating…' : 'Create'}
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
          <h3>About IAM User Creation</h3>
          <p>
            Creates a new IAM user with the specified role and access level. The user will be
            able to access cloud resources based on the policies attached to their role.
          </p>
          <p>
            Choose a role that matches the user&apos;s responsibilities. Roles determine the
            default set of permissions; individual policies can be added later.
          </p>
          <p>
            The email address is used for login and notifications. MFA can be enabled after
            account creation.
          </p>
        </div>
      </div>
    </div>
  )
}
