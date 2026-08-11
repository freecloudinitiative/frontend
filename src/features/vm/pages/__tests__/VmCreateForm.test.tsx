import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { VmCreateForm } from '@/features/vm/pages/VmCreateForm'
import { useToastStore } from '@/store/toastStore'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  useToastStore.setState({ toasts: [] })
})
afterAll(() => server.close())

function renderForm(onSuccess = vi.fn(), onCancel = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <VmCreateForm onCancel={onCancel} onSuccess={onSuccess} />
    </QueryClientProvider>,
  )
  return { onSuccess, onCancel }
}

describe('VmCreateForm — Toast Integration (PR #25 Test Scenario 4.1 & 9.2)', () => {
  it('shows green success toast on VM creation', async () => {
    const { onSuccess } = renderForm()
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    const diskInput = screen.getByLabelText('Disk (GB)') as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'new-test-vm' } })
    fireEvent.change(diskInput, { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())

    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('VM created successfully')
    expect(toasts[0].type).toBe('success')
  })

  it('shows red error toast on server failure without exposing raw error message', async () => {
    server.use(
      http.post('*/api/vms', () =>
        HttpResponse.json({ error: 'internal server error detail' }, { status: 500 }),
      ),
    )
    const { onSuccess } = renderForm()
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    const diskInput = screen.getByLabelText('Disk (GB)') as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'failing-vm' } })
    fireEvent.change(diskInput, { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      const toasts = useToastStore.getState().toasts
      expect(toasts.some((t) => t.message === 'Operation failed' && t.type === 'error')).toBe(true)
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
