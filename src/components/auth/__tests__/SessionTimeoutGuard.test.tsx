import { act, render } from '@testing-library/react'
import type { ContextType } from 'react'
import { AuthContext } from 'react-oidc-context'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionTimeoutGuard } from '@/components/auth/SessionTimeoutGuard'

const accountState = vi.hoisted(() => ({ timeoutMinutes: 1 }))

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

vi.mock('@/features/account/hooks', () => ({
  useAccount: () => ({ data: { sessionTimeoutMinutes: accountState.timeoutMinutes } }),
}))

function renderGuard() {
  const auth = {
    isAuthenticated: true,
    isLoading: false,
    user: {
      profile: { sub: 'user-1', auth_time: Math.floor(Date.now() / 1_000) },
      id_token: 'id-token',
    },
    stopSilentRenew: vi.fn(),
    revokeTokens: vi.fn().mockResolvedValue(undefined),
    signoutRedirect: vi.fn().mockResolvedValue(undefined),
    removeUser: vi.fn().mockResolvedValue(undefined),
  } as unknown as ContextType<typeof AuthContext>

  render(
    <AuthContext.Provider value={auth}>
      <SessionTimeoutGuard />
    </AuthContext.Provider>,
  )

  return auth!
}

describe('SessionTimeoutGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-04T10:00:00Z'))
    Object.defineProperty(window, 'localStorage', { configurable: true, value: createStorageMock() })
    accountState.timeoutMinutes = 1
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('logs out and revokes the refresh token after the configured inactivity period', async () => {
    const auth = renderGuard()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })

    expect(auth.stopSilentRenew).toHaveBeenCalledTimes(1)
    expect(auth.revokeTokens).toHaveBeenCalledWith(['refresh_token'])
    expect(auth.removeUser).toHaveBeenCalledTimes(1)
    expect(auth.signoutRedirect).toHaveBeenCalledWith({
      id_token_hint: 'id-token',
      post_logout_redirect_uri: 'http://localhost:3000/login?reason=idle&reauth=1',
    })
  })

  it('extends the idle deadline when the user interacts', async () => {
    const auth = renderGuard()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000)
      document.dispatchEvent(new Event('pointerdown'))
      await vi.advanceTimersByTimeAsync(45_000)
    })
    expect(auth.signoutRedirect).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(auth.signoutRedirect).toHaveBeenCalledTimes(1)
  })

  it('does not let returning focus revive an already idle session', async () => {
    const auth = renderGuard()

    await act(async () => {
      vi.setSystemTime(new Date('2026-09-04T10:02:00Z'))
      window.dispatchEvent(new Event('focus'))
      await Promise.resolve()
    })

    expect(auth.signoutRedirect).toHaveBeenCalledTimes(1)
  })
})
