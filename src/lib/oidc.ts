export interface OidcRuntimeConfig {
  authority: string
  client_id: string
  redirect_uri: string
}

/**
 * Returns the OIDC config derived from env vars, or null when auth is
 * disabled (pass-through mode). Only authority + client_id are required —
 * redirect_uri falls back to the current origin's /callback route.
 */
export function getOidcConfig(): OidcRuntimeConfig | null {
  const authority = import.meta.env.VITE_OIDC_AUTHORITY
  const client_id = import.meta.env.VITE_OIDC_CLIENT_ID
  const redirect_uri = import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/callback`

  if (!authority || !client_id) return null
  return { authority, client_id, redirect_uri }
}

export function isOidcConfigured(): boolean {
  return getOidcConfig() !== null
}
