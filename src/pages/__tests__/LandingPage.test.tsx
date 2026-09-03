import { render, screen } from '@testing-library/react'
import type { ContextType } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from 'react-oidc-context'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '@/pages/LandingPage'

function renderLanding() {
  const auth = {
    isAuthenticated: false,
    isLoading: false,
    user: undefined,
  } as unknown as ContextType<typeof AuthContext>

  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('LandingPage', () => {
  it('shows the shared project links in the framed landing shell', () => {
    const { container } = renderLanding()

    expect(container.querySelector('.fci-landing-shell')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About Creator' })).toHaveAttribute(
      'href',
      'https://theomerkaratas.github.io/resume/',
    )
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'href',
      'https://freecloudinitiative.github.io/docs/',
    )
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/freecloudinitiative',
    )
  })
})
