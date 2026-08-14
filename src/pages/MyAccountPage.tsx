import { useContext, useEffect, useState } from 'react'
import { AuthContext } from 'react-oidc-context'
import { isOidcConfigured } from '@/lib/oidc'
import { useThemeStore, type ThemeId } from '@/store/themeStore'
import { useToastStore } from '@/store/toastStore'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useAccount, useGenerateApiKey, useRevokeApiKey, useUpdateAccountSettings } from '@/features/account/hooks'
import type { AccountRegion } from '@/features/account/types'
import { useNavigate } from 'react-router-dom'
import { IconButton } from '@/components/ui/IconButton'
import { formatDate } from '@/lib/format'
import { getRuntimeConfig } from '@/lib/runtimeConfig'
import './tui-dashboard.css'

const THEME_OPTIONS: { value: ThemeId; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'beige', label: 'Beige' },
  { value: 'mono', label: 'Black & white' },
  { value: 'navy', label: 'Dark navy' },
  { value: 'sketch', label: 'Pencil Sketch' },
]

const REGION_OPTIONS: AccountRegion[] = ['ANK', 'IST']

const SESSION_TIMEOUT_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '120', label: '2 hours' },
  { value: '240', label: '4 hours' },
]

const TOGGLE_OPTIONS = ['Enabled', 'Disabled']

export function MyAccountPage() {
  const navigate = useNavigate()
  const goBack = () => navigate('/dashboard')
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const addToast = useToastStore((s) => s.addToast)
  const auth = useContext(AuthContext)
  const oidcConfigured = isOidcConfigured()
  const profile = oidcConfigured ? auth?.user?.profile : undefined
  const identityPortalUrl = oidcConfigured ? `${new URL(getRuntimeConfig().oidcAuthority).origin}/if/user/` : null

  const username = profile?.preferred_username ?? 'root@HEAD'
  const subject = profile?.sub ?? '—'

  const { data: account } = useAccount()
  const updateSettings = useUpdateAccountSettings()
  const generateKey = useGenerateApiKey()
  const revokeKey = useRevokeApiKey()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [defaultRegion, setDefaultRegion] = useState<AccountRegion>('IST')
  const [draftTheme, setDraftTheme] = useState<ThemeId>(theme)
  const [sessionTimeout, setSessionTimeout] = useState('60')
  const [emailAlerts, setEmailAlerts] = useState('Enabled')
  const [newKeyName, setNewKeyName] = useState('')
  const [newApiKeySecret, setNewApiKeySecret] = useState<string | null>(null)

  useEffect(() => {
    if (account) {
      setDefaultRegion(account.defaultRegion)
      setDraftTheme(account.theme ?? theme)
      setSessionTimeout(String(account.sessionTimeoutMinutes))
      setEmailAlerts(account.notifications.emailAlerts ? 'Enabled' : 'Disabled')
    }
  }, [account, theme])

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!account) return

    if (!newPassword.trim()) {
      addToast('Password cannot be empty', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error')
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    addToast('Password updated successfully', 'success')
  }

  function handleSettingsSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!account) return

    updateSettings.mutate(
      {
        defaultRegion,
        theme: draftTheme,
        sessionTimeoutMinutes: Number(sessionTimeout),
        notifications: {
          emailAlerts: emailAlerts === 'Enabled',
          weeklyDigest: account.notifications.weeklyDigest,
        },
      },
      {
        onSuccess: () => {
          setTheme(draftTheme)
          addToast('Settings saved successfully', 'success')
        },
        onError: () => {
          if (account) setDraftTheme(account.theme ?? theme)
          addToast('Failed to save account settings', 'error')
        },
      },
    )
  }

  function handleThemeChange(value: string) {
    setDraftTheme(value as ThemeId)
  }

  function handleCancel() {
    if (account) {
      setDraftTheme(account.theme ?? theme)
    }
    setNewPassword('')
    setConfirmPassword('')
    goBack()
  }

  function handleGenerateKey() {
    const name = newKeyName.trim()
    if (!name) {
      addToast('Enter a name for the new API key', 'error')
      return
    }

    generateKey.mutate(name, {
      onSuccess: (result) => {
        setNewKeyName('')
        setNewApiKeySecret(result.plaintextSecret)
        addToast('API key created. Copy it from the one-time secret field.', 'success')
      },
      onError: () => addToast('Failed to generate API key', 'error'),
    })
  }

  async function handleCopyApiKey() {
    if (!newApiKeySecret) return
    try {
      await navigator.clipboard.writeText(newApiKeySecret)
      addToast('API key copied to clipboard', 'success')
    } catch {
      addToast('Clipboard access failed. Select and copy the key manually.', 'error')
    }
  }

  function handleRevokeKey(keyId: string, name: string) {
    revokeKey.mutate(keyId, {
      onSuccess: () => addToast(`Revoked API key "${name}"`, 'success'),
      onError: () => addToast('Failed to revoke API key', 'error'),
    })
  }

  return (
    <div className="fci-page fci-account-page" data-theme={theme}>
      <div className="fci-tui" style={{ width: '100%', maxWidth: 600 }}>
        <button
          type="button"
          className="fci-tui-title fci-tui-title-link"
          onClick={goBack}
        >
          Free Cloud Initiative
        </button>
        <IconButton
          variant="back"
          placement="notch"
          onClick={goBack}
          title="Back to Dashboard"
          ariaLabel="Back to Dashboard"
        />
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', paddingTop: 10 }}>
          <div className="fci-detail-panel fci-panel-titled fci-account-panel">
            <div className="fci-box-label">My Account</div>

            <dl className="fci-account-grid">
              <dt>Username</dt>
              <dd>{username}</dd>
              <dt>Email</dt>
              <dd>{account?.email ?? '—'}</dd>
              <dt>Subject ID</dt>
              <dd>{subject}</dd>
            </dl>

            {/* ── Box 1: Password Management ──────────────────────────────────── */}
            <div className="fci-fieldbox fci-account-section">
              <label className="fci-box-label">Password Management</label>
              {identityPortalUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--dash-text-dim)' }}>
                    Passwords, MFA devices, and identity sessions are managed by Authentik.
                  </span>
                  <a className="fci-btn fci-btn-secondary" href={identityPortalUrl} target="_blank" rel="noreferrer">
                    Open Identity Settings
                  </a>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="fci-fieldrow" style={{ marginBottom: 0 }}>
                  <div className="fci-fieldbox" style={{ marginBottom: 0 }}>
                    <label htmlFor="account-new-password" className="fci-box-label">New Password</label>
                    <TerminalInput
                      id="account-new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="fci-fieldbox" style={{ marginBottom: 0 }}>
                    <label htmlFor="account-confirm-password" className="fci-box-label">Confirm Password</label>
                    <TerminalInput
                      id="account-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="fci-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 0 }}>
                  <button
                    type="submit"
                    className="fci-btn fci-btn-primary"
                    disabled={!account}
                  >
                    Update Password
                  </button>
                </div>
                </form>
              )}
            </div>

            {/* ── Box 2: Account Preferences ──────────────────────────────────── */}
            <div className="fci-fieldbox fci-account-section">
              <label className="fci-box-label">Account Preferences</label>
              <form onSubmit={handleSettingsSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="fci-fieldrow" style={{ marginBottom: 0 }}>
                  <TerminalSelect
                    id="account-default-region"
                    label="Default Region"
                    value={defaultRegion}
                    options={REGION_OPTIONS}
                    onChange={(val) => setDefaultRegion(val as AccountRegion)}
                  />
                  <TerminalSelect
                    id="account-theme"
                    label="Preferred Theme"
                    value={draftTheme}
                    options={THEME_OPTIONS}
                    onChange={handleThemeChange}
                  />
                </div>

                <div className="fci-fieldrow" style={{ marginBottom: 0 }}>
                  <TerminalSelect
                    id="account-session-timeout"
                    label="Session Timeout"
                    value={sessionTimeout}
                    options={SESSION_TIMEOUT_OPTIONS}
                    onChange={(val) => setSessionTimeout(val)}
                  />
                  <TerminalSelect
                    id="account-email-alerts"
                    label="Email Alerts"
                    value={emailAlerts}
                    options={TOGGLE_OPTIONS}
                    onChange={(val) => setEmailAlerts(val)}
                  />
                </div>

                <div className="fci-form-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 0 }}>
                  <button
                    type="submit"
                    className="fci-btn fci-btn-primary"
                    disabled={updateSettings.isPending || !account}
                  >
                    {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                  </button>
                  <button type="button" className="fci-btn fci-btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* ── Box 3: API Keys ────────────────────────────────────────────── */}
            <div className="fci-fieldbox fci-account-section">
              <label className="fci-box-label" htmlFor="account-new-key-name">API Keys</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {newApiKeySecret && (
                  <div role="status" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <strong>This secret is shown only once:</strong>
                    <code style={{ overflowWrap: 'anywhere', userSelect: 'all' }}>{newApiKeySecret}</code>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="fci-btn fci-btn-primary" onClick={handleCopyApiKey}>
                        Copy Secret
                      </button>
                      <button type="button" className="fci-btn fci-btn-secondary" onClick={() => setNewApiKeySecret(null)}>
                        I Have Saved It
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {account?.apiKeys.length ? (
                    account.apiKeys.map((key) => (
                      <div
                        key={key.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: '0.85rem' }}
                      >
                        <span>
                          {key.name} — ••••{key.lastFour} — created {formatDate(key.createdAt)}
                        </span>
                        <button
                          type="button"
                          className="fci-btn fci-btn-secondary"
                          onClick={() => handleRevokeKey(key.id, key.name)}
                          disabled={revokeKey.isPending}
                        >
                          Revoke
                        </button>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--dash-text-dim)' }}>No API keys yet.</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 0 }}>
                  <TerminalInput
                    id="account-new-key-name"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="new key name"
                  />
                  <button
                    type="button"
                    className="fci-btn fci-btn-primary"
                    onClick={handleGenerateKey}
                    disabled={generateKey.isPending}
                  >
                    {generateKey.isPending ? 'Generating...' : 'Generate New Key'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
