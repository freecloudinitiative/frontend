import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ContextType } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from 'react-oidc-context'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from '@/pages/LoginPage'

vi.mock('@/lib/oidc', () => ({
  isOidcConfigured: () => true,
}))

function renderLogin(signinRedirect: ReturnType<typeof vi.fn>, error?: Error) {
  const auth = {
    activeNavigator: undefined,
    error,
    isAuthenticated: false,
    isLoading: false,
    signinRedirect,
    user: undefined,
  } as unknown as ContextType<typeof AuthContext>

  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/account' } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('LoginPage', () => {
  it('starts the Authentik redirect automatically and preserves the destination', async () => {
    const signinRedirect = vi.fn().mockResolvedValue(undefined)

    renderLogin(signinRedirect)

    await waitFor(() => {
      expect(signinRedirect).toHaveBeenCalledTimes(1)
    })
    expect(signinRedirect).toHaveBeenCalledWith({ state: { from: '/account' } })
    expect(screen.getByText('[ CONNECTING TO AUTHENTIK... ]')).toBeInTheDocument()
  })

  it('offers a retry when Authentik cannot be reached', async () => {
    const user = userEvent.setup()
    const signinRedirect = vi
      .fn()
      .mockRejectedValueOnce(new Error('discovery unavailable'))
      .mockResolvedValueOnce(undefined)

    renderLogin(signinRedirect)

    const retry = await screen.findByRole('button', { name: '[ RETRY ]' })
    await user.click(retry)

    await waitFor(() => {
      expect(signinRedirect).toHaveBeenCalledTimes(2)
    })
  })

  it('waits for an explicit retry when AuthProvider already has an error', async () => {
    const user = userEvent.setup()
    const signinRedirect = vi.fn().mockResolvedValue(undefined)

    renderLogin(signinRedirect, new Error('OIDC metadata unavailable'))

    const retry = await screen.findByRole('button', { name: '[ RETRY ]' })
    expect(signinRedirect).not.toHaveBeenCalled()

    await user.click(retry)

    await waitFor(() => {
      expect(signinRedirect).toHaveBeenCalledTimes(1)
    })
  })
})
