import { getRuntimeConfig } from '@/lib/runtimeConfig'

export interface OidcRuntimeConfig {
  authority: string
  client_id: string
  redirect_uri: string
  response_type: 'code'
  scope: string
  automaticSilentRenew: boolean
  loadUserInfo: boolean
}

/**
 * Returns the OIDC config derived from env vars, or null when auth is
 * disabled (pass-through mode). Only authority + client_id are required —
 * redirect_uri falls back to the current origin's /callback route.
 */
export function getOidcConfig(): OidcRuntimeConfig | null {
  const runtime = getRuntimeConfig()
  const authority = runtime.oidcAuthority
  const client_id = runtime.oidcClientId
  const redirect_uri = runtime.oidcRedirectUri

  if (!authority || !client_id) return null
  return {
    authority,
    client_id,
    redirect_uri,
    response_type: 'code',
    // `offline_access` is required for a refresh token. Without it
    // automaticSilentRenew falls back to a hidden iframe against the
    // authority, which the app's CSP blocks (no frame-src) and for which
    // no silent_redirect_uri exists — sessions would die at access-token
    // expiry. The Authentik blueprint grants the matching scope mapping.
    scope: 'openid profile email offline_access',
    automaticSilentRenew: true,
    loadUserInfo: true,
  }
}

export function isOidcConfigured(): boolean {
  return getOidcConfig() !== null
}
