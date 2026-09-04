import {
  clearSessionActivity,
  clearSessionReauthenticationRequirement,
} from '@/lib/sessionActivity'

interface SignedInUser {
  profile: {
    sub: string
  }
}

export function handleSigninCallback(user?: SignedInUser): void {
  clearSessionActivity(user?.profile.sub)
  clearSessionReauthenticationRequirement()
  window.history.replaceState({}, document.title, window.location.pathname)
}
