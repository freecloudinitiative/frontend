import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from 'react-oidc-context'
import { isOidcConfigured } from '@/lib/oidc'
import { useThemeStore, type ThemeId } from '@/store/themeStore'
import { useToastStore } from '@/store/toastStore'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useAccount, useGenerateApiKey, useRevokeApiKey, useUpdateAccountSettings } from '@/features/account/hooks'
import type { AccountRegion } from '@/features/account/types'
import './tui-dashboard.css'

const THEME_OPTIONS: { value: ThemeId; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'beige', label: 'Beige' },
  { value: 'mono', label: 'Black & white' },
  { value: 'navy', label: 'Dark navy' },
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
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const addToast = useToastStore((s) => s.addToast)
  const auth = useContext(AuthContext)
  const profile = isOidcConfigured() ? auth?.user?.profile : undefined

  const username = profile?.preferred_username ?? 'root@HEAD'
  const subject = profile?.sub ?? '—'

  const { data: account } = useAccount()
  const updateSettings = useUpdateAccountSettings()
  const generateKey = useGenerateApiKey()
  const revokeKey = useRevokeApiKey()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [defaultRegion, setDefaultRegion] = useState<AccountRegion>('IST')
  const [sessionTimeout, setSessionTimeout] = useState('60')
  const [emailAlerts, setEmailAlerts] = useState('Enabled')
  const [weeklyDigest, setWeeklyDigest] = useState('Disabled')
  const [newKeyName, setNewKeyName] = useState('')

  useEffect(() => {
    if (account) {
      setDisplayName(account.displayName)
      setEmail(account.email)
      setDefaultRegion(account.defaultRegion)
      setSessionTimeout(String(account.sessionTimeoutMinutes))
      setEmailAlerts(account.notifications.emailAlerts ? 'Enabled' : 'Disabled')
      setWeeklyDigest(account.notifications.weeklyDigest ? 'Enabled' : 'Disabled')
    }
  }, [account])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    updateSettings.mutate(
      {
        displayName,
        email,
        defaultRegion,
        theme,
        sessionTimeoutMinutes: Number(sessionTimeout),
        notifications: {
          emailAlerts: emailAlerts === 'Enabled',
          weeklyDigest: weeklyDigest === 'Enabled',
        },
      },
      {
        onSuccess: () => addToast('Settings saved successfully', 'success'),
        onError: () => addToast('Failed to save account settings', 'error'),
      },
    )
  }

  function handleThemeChange(value: string) {
    setTheme(value as ThemeId)
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
        addToast(`API key created — copy it now, it won't be shown again: ${result.plaintextSecret}`, 'success', 8000)
      },
      onError: () => addToast('Failed to generate API key', 'error'),
    })
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
          onClick={() => navigate('/dashboard')}
        >
          Free Cloud Initiative
        </button>
        <button
          type="button"
          className="fci-tui-back-topright"
          onClick={() => navigate('/dashboard')}
          aria-label="Back to Dashboard"
          title="Back to Dashboard"
        >
          ← Back to Dashboard
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', paddingTop: 10 }}>
          <div className="fci-detail-panel fci-panel-titled fci-account-panel">
            <div className="fci-box-label">My Account</div>

            <dl className="fci-account-grid">
              <dt>Username</dt>
              <dd>{username}</dd>
              <dt>Subject ID</dt>
              <dd>{subject}</dd>
            </dl>

            <form onSubmit={handleSubmit} noValidate style={{ marginTop: 18 }}>
              <div className="fci-fieldrow">
                <div className="fci-fieldbox">
                  <label htmlFor="account-display-name" className="fci-box-label">Display Name</label>
                  <TerminalInput
                    id="account-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="root"
                  />
                </div>
                <div className="fci-fieldbox">
                  <label htmlFor="account-email" className="fci-box-label">Email Address</label>
                  <TerminalInput
                    id="account-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="fci-fieldrow">
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
                  value={theme}
                  options={THEME_OPTIONS}
                  onChange={handleThemeChange}
                />
              </div>

              <div className="fci-fieldrow">
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

              <div className="fci-fieldrow">
                <TerminalSelect
                  id="account-weekly-digest"
                  label="Weekly Digest"
                  value={weeklyDigest}
                  options={TOGGLE_OPTIONS}
                  onChange={(val) => setWeeklyDigest(val)}
                />
              </div>

              <div className="fci-form-actions" style={{ marginTop: 16 }}>
                <button
                  type="submit"
                  className="fci-btn fci-btn-primary"
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                </button>
                <button type="button" className="fci-btn fci-btn-secondary" onClick={() => navigate('/dashboard')}>
                  Cancel
                </button>
              </div>
            </form>

            <div className="fci-fieldbox" style={{ marginTop: 20 }}>
              <label className="fci-box-label" htmlFor="account-new-key-name">API Keys</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {account?.apiKeys.length ? (
                  account.apiKeys.map((key) => (
                    <div
                      key={key.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: '0.85rem' }}
                    >
                      <span>
                        {key.name} — ••••{key.lastFour} — created {new Date(key.createdAt).toLocaleDateString()}
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
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
  )
}
