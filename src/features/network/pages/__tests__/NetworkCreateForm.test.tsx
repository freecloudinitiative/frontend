import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { NetworkCreateForm } from '@/features/network/pages/NetworkCreateForm'
import { useToastStore } from '@/store/toastStore'
import { resetNetworkStore } from '@/mocks/data/networks'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetNetworkStore()
  useToastStore.setState({ toasts: [] })
})
afterAll(() => server.close())

function renderForm(onSuccess = vi.fn(), onCancel = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <NetworkCreateForm onCancel={onCancel} onSuccess={onSuccess} />
    </QueryClientProvider>,
  )
  return { onSuccess, onCancel }
}

describe('NetworkCreateForm — Toast Integration (PR #25 Test Scenario 4.4)', () => {
  it('shows green success toast on network creation', async () => {
    const { onSuccess } = renderForm()
    const nameInput = screen.getByLabelText('VPC Name') as HTMLInputElement
    const cidrInput = screen.getByLabelText('CIDR Block') as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'prod-vpc' } })
    fireEvent.change(cidrInput, { target: { value: '10.0.0.0/16' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())

    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Network created successfully')
    expect(toasts[0].type).toBe('success')
  })

  it('shows error toast on network creation failure', async () => {
    server.use(
      http.post('*/api/networks', () =>
        HttpResponse.json({ error: 'CIDR overlap' }, { status: 400 }),
      ),
    )
    const { onSuccess } = renderForm()
    const nameInput = screen.getByLabelText('VPC Name') as HTMLInputElement
    const cidrInput = screen.getByLabelText('CIDR Block') as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'invalid-vpc' } })
    fireEvent.change(cidrInput, { target: { value: '10.0.0.0/16' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      const toasts = useToastStore.getState().toasts
      expect(toasts.some((t) => t.message === 'Operation failed' && t.type === 'error')).toBe(true)
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
