import { afterEach, describe, expect, it } from 'vitest'
import { assertValidProductionConfig, getProductionConfigErrors, getRuntimeConfig } from '@/lib/runtimeConfig'

afterEach(() => {
  delete window.__FCI_CONFIG__
})

describe('runtime configuration', () => {
  it('reads container runtime configuration before Vite build-time values', () => {
    window.__FCI_CONFIG__ = {
      oidcAuthority: 'https://auth.example.com/application/o/fci/',
      oidcClientId: 'fci-console',
      oidcRedirectUri: 'https://console.example.com/callback',
      apiBaseUrl: '',
      enableRealTerminal: true,
      wsBaseUrl: 'wss://console.example.com',
    }

    expect(getRuntimeConfig()).toMatchObject({
      oidcClientId: 'fci-console',
      enableRealTerminal: true,
      wsBaseUrl: 'wss://console.example.com',
    })
  })

  it('rejects production configuration without OIDC', () => {
    window.__FCI_CONFIG__ = {}

    expect(getProductionConfigErrors()).toContain('oidcAuthority is required')
    expect(getProductionConfigErrors()).toContain('oidcClientId is required')
    expect(() => assertValidProductionConfig()).toThrow('Invalid production runtime configuration')
  })



  it('rejects insecure production endpoints', () => {
    window.__FCI_CONFIG__ = {
      oidcAuthority: 'http://auth.example.com',
      oidcClientId: 'fci-console',
      oidcRedirectUri: 'http://console.example.com/callback',
      apiBaseUrl: 'http://api.example.com',
      enableRealTerminal: true,
      wsBaseUrl: 'ws://console.example.com',
    }

    expect(getProductionConfigErrors()).toEqual([
      'oidcAuthority must use HTTPS',
      'oidcRedirectUri must use HTTPS',
      'apiBaseUrl must use HTTPS',
      'wsBaseUrl must use WSS when the real terminal is enabled',
    ])
  })
})
