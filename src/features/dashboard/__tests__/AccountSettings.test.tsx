import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '@/test/server'
import { MyAccountPage } from '@/pages/MyAccountPage'
import { useToastStore } from '@/store/toastStore'
import { resetAccountStore } from '@/mocks/data/account'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  resetAccountStore()
  useToastStore.setState({ toasts: [] })
})
afterAll(() => server.close())

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MyAccountPage', () => {
  it('loads account settings, edits the display name, and saves with a success toast', async () => {
    renderWithProviders(<MyAccountPage />)

    const displayNameInput = await screen.findByLabelText(/Display Name/i)
    await waitFor(() => expect(displayNameInput).toHaveValue('root'))

    fireEvent.change(displayNameInput, { target: { value: 'octocat' } })

    const submitBtn = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(useToastStore.getState().toasts.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
    expect(useToastStore.getState().toasts[0].type).toBe('success')
  })

  it('generates a new API key and shows it in the list', async () => {
    renderWithProviders(<MyAccountPage />)

    await screen.findByLabelText(/Display Name/i)

    const keyNameInput = screen.getByPlaceholderText('new key name')
    fireEvent.change(keyNameInput, { target: { value: 'test-key' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate New Key/i }))

    await waitFor(() => {
      expect(screen.getByText(/test-key/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
