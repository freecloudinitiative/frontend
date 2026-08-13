import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useCreateIamUser } from '@/features/iam/hooks'
import { useIamStore } from '@/features/iam/store'
import type { CreateIamUserInput, IamUserRole } from '@/features/iam/types'
import { useEntityForm } from '@/lib/useEntityForm'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'auditor', label: 'Auditor' },
]

function validate(form: { name: string; email: string }) {
  const errors: Record<string, string> = {}
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

export function IamCreateForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void
  onSuccess: () => void
}) {
  const form = useIamStore((state) => state.createForm)
  const storeErrors = useIamStore((state) => state.createFormErrors)
  const setField = useIamStore((state) => state.setCreateFormField)
  const setStoreErrors = useIamStore((state) => state.setCreateFormErrors)
  const resetForm = useIamStore((state) => state.resetCreateForm)

  const createIamUser = useCreateIamUser()

  const { errors, handleCancel, handleSubmit } = useEntityForm<
    typeof form,
    Record<string, string>,
    CreateIamUserInput
  >({
    form,
    resetForm,
    validate,
    buildInput: (form) => ({
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
    }),
    mutate: createIamUser.mutate,
    successMessage: 'IAM user created successfully',
    logLabel: 'IamCreateForm submit',
    onCancel,
    onSuccess,
    errors: storeErrors,
    setErrors: setStoreErrors,
  })

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
