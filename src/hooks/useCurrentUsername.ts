import { useContext } from 'react'
import { AuthContext } from 'react-oidc-context'
import { isOidcConfigured } from '@/lib/oidc'

/**
 * Shown wherever the platform names the signed-in user, when the real one is
 * unknown: OIDC is not configured (local dev, the MSW mock stack), or the
 * provider issued a token without `preferred_username`.
 */
export const FALLBACK_USERNAME = 'root@HEAD'

/**
 * The signed-in user's display name.
 *
 * `AuthContext` is only mounted when OIDC is configured, so this reads through
 * an optional chain rather than `useAuth()` -- the latter throws outside a
 * provider, and both the profile menu and the account page render in builds
 * that have none.
 */
export function useCurrentUsername(): string {
  const auth = useContext(AuthContext)
  const profile = isOidcConfigured() ? auth?.user?.profile : undefined
  const username = profile?.preferred_username
  return typeof username === 'string' && username.trim() ? username : FALLBACK_USERNAME
}

/**
 * Widest username the profile button renders in full. The button sits in the
 * top bar next to the region selector and must not grow with its label: past
 * this many characters the name is cut and given a single-character ellipsis,
 * and the untruncated value stays reachable through the element's `title`.
 */
export const PROFILE_NAME_MAX_CHARS = 18

/** Truncates to `max` characters *including* the ellipsis, so the rendered
 * width is bounded by `max` regardless of input. */
export function truncateUsername(username: string, max: number = PROFILE_NAME_MAX_CHARS): string {
  if (max <= 0) return ''
  if (username.length <= max) return username
  if (max === 1) return '…'
  return `${username.slice(0, max - 1)}…`
}
