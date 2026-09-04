import { beforeEach, describe, expect, it } from 'vitest'
import { handleSigninCallback } from '@/lib/authCallbacks'
import { sessionActivityStorageKey } from '@/lib/sessionActivity'

function createStorageMock(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key) },
    setItem: (key, value) => { values.set(key, String(value)) },
  }
}

describe('handleSigninCallback', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: createStorageMock() })
    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: createStorageMock() })
    window.history.replaceState({}, '', '/callback?code=test&state=test')
  })

  it('starts a fresh idle clock even when the new token has no auth_time claim', () => {
    window.localStorage.setItem(sessionActivityStorageKey('user-1'), String(Date.now() - 3_600_000))
    window.sessionStorage.setItem('fci:reauthentication-required', '1')

    handleSigninCallback({ profile: { sub: 'user-1' } })

    expect(window.localStorage.getItem(sessionActivityStorageKey('user-1'))).toBeNull()
    expect(window.sessionStorage.getItem('fci:reauthentication-required')).toBeNull()
    expect(window.location.pathname).toBe('/callback')
    expect(window.location.search).toBe('')
  })
})
