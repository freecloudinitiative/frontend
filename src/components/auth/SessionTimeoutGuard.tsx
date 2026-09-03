import { useContext, useEffect, useRef } from 'react'
import { AuthContext } from 'react-oidc-context'
import { useAccount } from '@/features/account/hooks'
import {
  clearSessionActivity,
  markSessionReauthenticationRequired,
  sessionActivityStorageKey,
} from '@/lib/sessionActivity'

const ACTIVITY_WRITE_THROTTLE_MS = 1_000
const IDLE_LOGIN_PATH = '/login?reason=idle&reauth=1'
const ACTIVITY_EVENTS = ['keydown', 'pointerdown', 'scroll', 'touchstart'] as const

function readTimestamp(key: string): number | null {
  try {
    const value = Number(window.localStorage.getItem(key))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function writeTimestamp(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // The in-memory timer still enforces the timeout when storage is blocked.
  }
}

/**
 * Enforces the account's inactivity timeout independently of OIDC token renewal.
 * Activity is shared between tabs, while the key is scoped to the OIDC subject.
 */
export function SessionTimeoutGuard() {
  const auth = useContext(AuthContext)
  const isAuthenticated = auth?.isAuthenticated === true
  const subject = typeof auth?.user?.profile.sub === 'string' ? auth.user.profile.sub : undefined
  const authTimeSeconds = Number(auth?.user?.profile.auth_time)
  const authenticatedAt = Number.isFinite(authTimeSeconds) ? authTimeSeconds * 1_000 : 0
  const account = useAccount(subject, isAuthenticated && Boolean(subject))
  const sessionTimeoutMinutes = account.data?.sessionTimeoutMinutes
  const logoutStarted = useRef(false)
  const memoryActivity = useRef<{ key: string; timestamp: number } | null>(null)

  useEffect(() => {
    if (!auth || !isAuthenticated || !subject || sessionTimeoutMinutes === undefined) {
      logoutStarted.current = false
      return
    }

    const timeoutMs = sessionTimeoutMinutes * 60_000
    const key = sessionActivityStorageKey(subject)
    const idleLoginUrl = `${window.location.origin}${IDLE_LOGIN_PATH}`
    const now = Date.now()
    const storedActivity = readTimestamp(key) ?? (memoryActivity.current?.key === key ? memoryActivity.current.timestamp : null)
    let lastActivity = storedActivity ?? now

    // A genuinely new authentication must not inherit an old user's idle clock.
    if (storedActivity === null || storedActivity < authenticatedAt) {
      lastActivity = now
      memoryActivity.current = { key, timestamp: lastActivity }
      writeTimestamp(key, lastActivity)
    }

    let timeoutId: ReturnType<typeof window.setTimeout> | undefined

    const expireSession = async () => {
      if (logoutStarted.current) return
      logoutStarted.current = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)

      auth.stopSilentRenew()
      clearSessionActivity(subject)
      markSessionReauthenticationRequired()
      const idToken = auth.user?.id_token

      // Revocation is best-effort: an unavailable revocation endpoint must not
      // leave the local browser session authenticated.
      try {
        await auth.revokeTokens(['refresh_token'])
      } catch {
        // Continue to RP-initiated logout.
      }

      // Remove the local user before navigating. react-oidc-context records
      // navigator errors in context instead of rejecting them, so redirect
      // failure must never be able to leave a usable local session behind.
      try {
        await auth.removeUser()
      } catch {
        // The IdP logout still gets a chance to invalidate the session.
      }
      try {
        await auth.signoutRedirect({
          id_token_hint: idToken,
          post_logout_redirect_uri: idleLoginUrl,
        })
      } catch {
        window.location.replace(idleLoginUrl)
      }
    }

    const scheduleExpiry = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      const remaining = timeoutMs - (Date.now() - lastActivity)
      if (remaining <= 0) {
        void expireSession()
        return
      }
      timeoutId = window.setTimeout(() => void expireSession(), remaining)
    }

    const recordActivity = () => {
      const activityAt = Date.now()
      if (activityAt - lastActivity >= timeoutMs) {
        void expireSession()
        return
      }
      if (activityAt - lastActivity < ACTIVITY_WRITE_THROTTLE_MS) return
      lastActivity = activityAt
      memoryActivity.current = { key, timestamp: lastActivity }
      writeTimestamp(key, lastActivity)
      scheduleExpiry()
    }

    const receiveActivity = (event: StorageEvent) => {
      if (event.key !== key || event.newValue === null) return
      const activityAt = Number(event.newValue)
      if (!Number.isFinite(activityAt) || activityAt <= lastActivity) return
      lastActivity = activityAt
      memoryActivity.current = { key, timestamp: lastActivity }
      scheduleExpiry()
    }

    for (const eventName of ACTIVITY_EVENTS) {
      document.addEventListener(eventName, recordActivity, { capture: true, passive: true })
    }
    window.addEventListener('focus', recordActivity)
    window.addEventListener('storage', receiveActivity)
    scheduleExpiry()

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      for (const eventName of ACTIVITY_EVENTS) {
        document.removeEventListener(eventName, recordActivity, { capture: true })
      }
      window.removeEventListener('focus', recordActivity)
      window.removeEventListener('storage', receiveActivity)
    }
  }, [auth, authenticatedAt, isAuthenticated, sessionTimeoutMinutes, subject])

  return null
}
