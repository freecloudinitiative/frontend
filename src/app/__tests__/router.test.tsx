/**
 * PR #33 — lazy route resolution smoke tests.
 * router.tsx converts page-level imports to React.lazy(); these tests confirm
 * the Suspense boundary resolves to the correct page for a few representative
 * routes instead of hanging on the loading fallback or throwing.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider } from 'react-router-dom'
import { server } from '@/test/server'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('router — lazy route resolution', () => {
  it('resolves the lazy NotFoundPage chunk for an unknown path', async () => {
    await router.navigate('/this-route-does-not-exist')
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )

    await waitFor(() => expect(screen.getByText('RESOURCE NOT FOUND')).toBeTruthy())
  })

  it('resolves the lazy DashboardPage chunk for a service tab route', async () => {
    await router.navigate('/services/vm/details')
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )

    await waitFor(() => expect(screen.getAllByText('VM').length).toBeGreaterThan(0))
  })

  it('resolves the lazy StandaloneConsolePage chunk (and its lazy TerminalView)', async () => {
    await router.navigate('/console/test-vm')
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )

    await waitFor(() => expect(screen.getByText(/Serial Console/)).toBeTruthy())
  })
})
