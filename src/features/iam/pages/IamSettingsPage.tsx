import { useState, useEffect } from 'react'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useIamUser, useIamUsers, useUpdateIamSettings } from '@/features/iam/hooks'
import { useToastStore } from '@/store/toastStore'

interface IamSettingsPageProps {
  onBack: () => void
  selectedRowId?: string | null
}

const MFA_OPTIONS = ['Required', 'Optional', 'Disabled']

export function IamSettingsPage({ onBack, selectedRowId }: IamSettingsPageProps) {
  const { data: users } = useIamUsers()
  const activeUserId = selectedRowId || users?.[0]?.id || ''
  const { data: user } = useIamUser(activeUserId)
  const updateSettings = useUpdateIamSettings()
  const addToast = useToastStore((state) => state.addToast)

  const [mfaRequirement, setMfaRequirement] = useState('Required')
  const [passwordExpiration, setPasswordExpiration] = useState('90')
  const [sessionTimeout, setSessionTimeout] = useState('60')

  useEffect(() => {
    if (user) {
      setMfaRequirement(user.mfaEnabled ? 'Required' : 'Optional')
    }
  }, [user])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeUserId) {
      addToast('No IAM user selected for settings update', 'error')
      return
    }

    updateSettings.mutate(
      {
        id: activeUserId,
        settings: {
          mfaRequirement,
          passwordExpirationDays: Number(passwordExpiration),
          sessionTimeoutMinutes: Number(sessionTimeout),
        },
      },
      {
        onSuccess: () => {
          addToast(`IAM settings updated for ${user?.name || activeUserId}`, 'success')
        },
        onError: () => {
          addToast('Failed to update IAM settings', 'error')
        },
      },
    )
  }

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">IAM Settings {user ? `— ${user.name}` : ''}</div>
      <button
        type="button"
        className="fci-linkbtn fci-action-back fci-box-key-top"
        onClick={onBack}
        aria-label="Back"
        title="Back"
      >
        &lt;&lt;
      </button>

      <div className="fci-split-layout" style={{ marginTop: 14 }}>
        <div className="fci-split-fields">
          <form onSubmit={handleSubmit} noValidate>
            <div className="fci-fieldrow">
              <TerminalSelect
                id="iam-mfa-req"
                label="MFA Requirement"
                value={mfaRequirement}
                options={MFA_OPTIONS}
                onChange={(val) => setMfaRequirement(val)}
              />
              <div className="fci-fieldbox">
                <label htmlFor="iam-pwd-expire" className="fci-box-label">Password Expiration (days)</label>
                <TerminalInput
                  id="iam-pwd-expire"
                  type="number"
                  value={passwordExpiration}
                  onChange={(e) => setPasswordExpiration(e.target.value)}
                  placeholder="90"
                />
              </div>
            </div>

            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="iam-session-timeout" className="fci-box-label">Session Timeout (minutes)</label>
                <TerminalInput
                  id="iam-session-timeout"
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="fci-form-actions" style={{ marginTop: 16 }}>
              <button
                type="submit"
                className="fci-btn fci-btn-primary"
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
              </button>
              <button type="button" className="fci-btn fci-btn-secondary" onClick={onBack}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
