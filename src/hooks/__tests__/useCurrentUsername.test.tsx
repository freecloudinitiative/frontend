import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  FALLBACK_USERNAME,
  PROFILE_NAME_MAX_CHARS,
  truncateUsername,
} from '@/hooks/useCurrentUsername'
import { ProfileMenu } from '@/features/dashboard/ProfileMenu'

const mocks = vi.hoisted(() => ({ profile: undefined as Record<string, unknown> | undefined }))

vi.mock('@/lib/oidc', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/oidc')>()),
  isOidcConfigured: () => true,
}))

vi.mock('react-oidc-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-oidc-context')>()
  const React = await import('react')
  return {
    ...actual,
    // A context whose default value is the mocked auth state: ProfileMenu reads
    // it with useContext and renders outside any AuthProvider in these cases.
    AuthContext: React.createContext<unknown>({ get user() { return { profile: mocks.profile } } }),
  }
})

const profileProps = {
  profileOpen: false,
  setProfileOpen: vi.fn(),
  toggleProfile: vi.fn(),
  isMobile: false,
  isCompact: false,
  theme: 'default' as const,
  setTheme: vi.fn(),
  handleSignOut: vi.fn(),
  showKeyHint: false,
}

function renderProfileMenu() {
  render(
    <MemoryRouter>
      <ProfileMenu {...profileProps} />
    </MemoryRouter>,
  )
  const name = document.querySelector('.fci-profile-name')
  if (!name) throw new Error('profile name element not rendered')
  return name as HTMLElement
}

afterEach(() => {
  mocks.profile = undefined
})

describe('truncateUsername', () => {
  it('leaves a name at or under the limit alone', () => {
    expect(truncateUsername('omer', 10)).toBe('omer')
    expect(truncateUsername('exactly-10', 10)).toBe('exactly-10')
  })

  // The point of the cap is a bounded rendered width, so the ellipsis has to
  // come out of the budget rather than be added on top of it.
  it('never returns more characters than the limit, ellipsis included', () => {
    const truncated = truncateUsername('a-very-long-federated-username@example.com', 12)
    expect(truncated).toHaveLength(12)
    expect(truncated.endsWith('…')).toBe(true)
  })

  it('handles degenerate limits without throwing', () => {
    expect(truncateUsername('anything', 1)).toBe('…')
    expect(truncateUsername('anything', 0)).toBe('')
  })
})

describe('ProfileMenu username', () => {
  it('falls back when the token carries no preferred_username', () => {
    expect(renderProfileMenu()).toHaveTextContent(FALLBACK_USERNAME)
  })

  it('shows the signed-in username', () => {
    mocks.profile = { preferred_username: 'omer' }
    expect(renderProfileMenu()).toHaveTextContent('omer')
  })

  it('ignores a blank preferred_username', () => {
    mocks.profile = { preferred_username: '   ' }
    expect(renderProfileMenu()).toHaveTextContent(FALLBACK_USERNAME)
  })

  // The button sits in a fixed top bar; a long federated name must not widen it.
  it('truncates a long username and keeps the full value in the tooltip', () => {
    const long = 'a-really-long-federated-username@identity.example.com'
    mocks.profile = { preferred_username: long }

    const name = renderProfileMenu()
    expect(name.textContent).toHaveLength(PROFILE_NAME_MAX_CHARS)
    expect(name.textContent?.endsWith('…')).toBe(true)
    expect(name).toHaveAttribute('title', long)
    expect(name.style.maxWidth).toBe(`${PROFILE_NAME_MAX_CHARS}ch`)
  })

  it('leaves off the tooltip when nothing was cut', () => {
    mocks.profile = { preferred_username: 'omer' }
    expect(renderProfileMenu()).not.toHaveAttribute('title')
  })
})
