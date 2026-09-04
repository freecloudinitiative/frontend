export interface RuntimeConfig {
  apiBaseUrl: string
  oidcAuthority: string
  oidcClientId: string
  oidcRedirectUri: string
  enableRealTerminal: boolean
  wsBaseUrl: string
}

interface RuntimeConfigSource {
  apiBaseUrl?: string
  oidcAuthority?: string
  oidcClientId?: string
  oidcRedirectUri?: string
  enableRealTerminal?: boolean | string
  wsBaseUrl?: string
}

declare global {
  interface Window {
    __FCI_CONFIG__?: RuntimeConfigSource
  }
}

function parseBoolean(value: boolean | string | undefined): boolean {
  return value === true || value === 'true'
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function source(): RuntimeConfigSource {
  const buildTimeConfig: RuntimeConfigSource = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    oidcAuthority: import.meta.env.VITE_OIDC_AUTHORITY,
    oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID,
    oidcRedirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI,
    enableRealTerminal: import.meta.env.VITE_ENABLE_REAL_TERMINAL,
    wsBaseUrl: import.meta.env.VITE_WS_BASE_URL,
  }

  if (typeof window !== 'undefined' && window.__FCI_CONFIG__) {
    return { ...buildTimeConfig, ...window.__FCI_CONFIG__ }
  }

  return buildTimeConfig
}

export function getRuntimeConfig(): RuntimeConfig {
  const value = source()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return {
    apiBaseUrl: trimTrailingSlash(value.apiBaseUrl?.trim() ?? ''),
    oidcAuthority: value.oidcAuthority?.trim() ?? '',
    oidcClientId: value.oidcClientId?.trim() ?? '',
    oidcRedirectUri: value.oidcRedirectUri?.trim() || `${origin}/callback`,
    enableRealTerminal: parseBoolean(value.enableRealTerminal),
    wsBaseUrl: trimTrailingSlash(value.wsBaseUrl?.trim() ?? ''),
  }
}

function requireHttps(name: string, value: string, errors: string[]) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') errors.push(`${name} must use HTTPS`)
  } catch {
    errors.push(`${name} must be a valid absolute URL`)
  }
}

export function getProductionConfigErrors(config: RuntimeConfig = getRuntimeConfig()): string[] {
  // Relax strict configuration checks when running locally via 'npm run dev', but keep them for unit tests.
  if (import.meta.env.DEV && !import.meta.env.TEST) return []

  const errors: string[] = []
  if (!config.oidcAuthority) errors.push('oidcAuthority is required')
  else requireHttps('oidcAuthority', config.oidcAuthority, errors)
  if (!config.oidcClientId) errors.push('oidcClientId is required')
  if (!config.oidcRedirectUri) errors.push('oidcRedirectUri is required')
  else requireHttps('oidcRedirectUri', config.oidcRedirectUri, errors)

  if (config.apiBaseUrl) requireHttps('apiBaseUrl', config.apiBaseUrl, errors)
  if (config.enableRealTerminal && config.wsBaseUrl) {
    try {
      const url = new URL(config.wsBaseUrl)
      if (url.protocol !== 'wss:') errors.push('wsBaseUrl must use WSS when the real terminal is enabled')
    } catch {
      errors.push('wsBaseUrl must be a valid absolute WebSocket URL')
    }
  }

  return errors
}

export function assertValidProductionConfig(config: RuntimeConfig = getRuntimeConfig()): void {
  const errors = getProductionConfigErrors(config)
  if (errors.length > 0) {
    throw new Error(`Invalid production runtime configuration: ${errors.join('; ')}`)
  }
}

export function isProductionRuntime(): boolean {
  return true
}
