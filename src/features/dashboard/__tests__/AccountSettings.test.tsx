import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '@/test/server'
import { MyAccountPage } from '@/pages/MyAccountPage'
import { useToastStore } from '@/store/toastStore'
import { resetAccountStore } from '@/mocks/data/account'

import { ToastContainer } from '@/features/dashboard/Toast'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  resetAccountStore()
  act(() => {
    useToastStore.setState({ toasts: [] })
  })
})
afterAll(() => server.close())

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
        <ToastContainer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MyAccountPage', () => {
  it('validates password matching and non-empty status on independent Update Password action', async () => {
    renderWithProviders(<MyAccountPage />)

    const newPasswordInput = await screen.findByLabelText(/New Password/i)
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i)
    const updatePasswordBtn = screen.getByRole('button', { name: /Update Password/i })

    // Wait until account data is loaded and button is enabled
    await waitFor(() => expect(updatePasswordBtn).not.toBeDisabled())

    // Test empty password validation — asserts notification renders in-place on screen
    fireEvent.click(updatePasswordBtn)
    expect(await screen.findByText('Password cannot be empty')).toBeInTheDocument()

    // Test password mismatch validation — asserts notification renders in-place on screen
    act(() => {
      useToastStore.setState({ toasts: [] })
    })
    fireEvent.change(newPasswordInput, { target: { value: 'secret123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'different' } })
    fireEvent.click(updatePasswordBtn)
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()

    // Test successful submission when passwords match — asserts notification renders in-place on screen
    act(() => {
      useToastStore.setState({ toasts: [] })
    })
    fireEvent.change(confirmPasswordInput, { target: { value: 'secret123' } })
    fireEvent.click(updatePasswordBtn)

    expect(await screen.findByText('Password updated successfully')).toBeInTheDocument()
    expect(newPasswordInput).toHaveValue('')
    expect(confirmPasswordInput).toHaveValue('')
  })

  it('saves general account settings independently without requiring password', async () => {
    renderWithProviders(<MyAccountPage />)

    const submitBtn = await screen.findByRole('button', { name: /Save Settings/i })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())

    fireEvent.click(submitBtn)
    expect(await screen.findByText('Settings saved successfully')).toBeInTheDocument()
  })

  it('generates a new API key and shows it in the list', async () => {
    renderWithProviders(<MyAccountPage />)

    await screen.findByLabelText(/New Password/i)

    const keyNameInput = screen.getByPlaceholderText('new key name')
    fireEvent.change(keyNameInput, { target: { value: 'test-key' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate New Key/i }))

    await waitFor(() => {
      expect(screen.getByText(/test-key/i)).toBeInTheDocument()
      expect(screen.getByText(/^fci_/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Copy Secret/i })).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
