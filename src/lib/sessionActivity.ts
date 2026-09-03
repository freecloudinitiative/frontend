const ACTIVITY_STORAGE_PREFIX = 'fci:last-activity'
const REAUTHENTICATION_REQUIRED_KEY = 'fci:reauthentication-required'

export function sessionActivityStorageKey(subject: string): string {
  return `${ACTIVITY_STORAGE_PREFIX}:${subject}`
}

export function clearSessionActivity(subject?: string): void {
  if (!subject) return
  try {
    window.localStorage.removeItem(sessionActivityStorageKey(subject))
  } catch {
    // Logout must continue even when storage is unavailable.
  }
}

export function markSessionReauthenticationRequired(): void {
  try {
    window.sessionStorage.setItem(REAUTHENTICATION_REQUIRED_KEY, '1')
  } catch {
    // The logout redirect also carries reauth=1 as a storage-free fallback.
  }
}

export function isSessionReauthenticationRequired(): boolean {
  try {
    return window.sessionStorage.getItem(REAUTHENTICATION_REQUIRED_KEY) === '1'
  } catch {
    return false
  }
}

export function clearSessionReauthenticationRequirement(): void {
  try {
    window.sessionStorage.removeItem(REAUTHENTICATION_REQUIRED_KEY)
  } catch {
    // A blocked store has nothing persistent to clear.
  }
}
