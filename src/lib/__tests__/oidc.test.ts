import { afterEach, describe, expect, it } from 'vitest'
import { getOidcConfig } from '@/lib/oidc'

afterEach(() => {
  delete window.__FCI_CONFIG__
})

describe('OIDC configuration', () => {
  it('allows a slow but healthy discovery response', () => {
    window.__FCI_CONFIG__ = {
      oidcAuthority: 'https://auth.example.com/application/o/fci/',
      oidcClientId: 'fci-console',
      oidcRedirectUri: 'https://console.example.com/callback',
    }

    expect(getOidcConfig()).toMatchObject({
      requestTimeoutInSeconds: 30,
      post_logout_redirect_uri: 'http://localhost:3000/',
    })
  })
})
