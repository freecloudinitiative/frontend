import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { DatabaseCreateForm } from '@/features/database/pages/DatabaseCreateForm'
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
      <DatabaseCreateForm onCancel={onCancel} onSuccess={onSuccess} />
    </QueryClientProvider>,
  )
  return { onSuccess, onCancel }
}

describe('DatabaseCreateForm — Toast Integration (PR #25 Test Scenario 4.2)', () => {
  it('shows expanded resource options and prevents unavailable engines and regions from being selected', () => {
    renderForm()

    const engineSelect = document.querySelector('#db-create-engine') as HTMLElement
    const regionSelect = document.querySelector('#db-create-region') as HTMLElement
    const cpuSelect = document.querySelector('#db-create-cpu') as HTMLElement
    const memorySelect = document.querySelector('#db-create-memory') as HTMLElement

    expect(engineSelect).toHaveTextContent('PostgreSQL')
    expect(cpuSelect).toHaveTextContent('16')
    expect(memorySelect).toHaveTextContent('0.5')

    fireEvent.click(engineSelect)
    for (const engine of ['MySQL', 'Redis', 'Valkey', 'SQLite']) {
      expect(screen.getByText(engine)).toHaveClass('fci-dd-item-disabled')
    }
    fireEvent.click(screen.getByText('Valkey'))
    expect(engineSelect).toHaveTextContent('PostgreSQL')

    fireEvent.click(regionSelect)
    fireEvent.click(screen.getByText('ANK'))
    expect(regionSelect).toHaveTextContent('IST')
    expect(screen.getByText('ANK')).toHaveClass('fci-dd-item-disabled')
  })

  it('shows green success toast on database creation', async () => {
    const { onSuccess } = renderForm()
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    const storageInput = screen.getByLabelText('Storage Size (GB)') as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'test-db-app' } })
    fireEvent.change(storageInput, { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())

    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Database created successfully')
    expect(toasts[0].type).toBe('success')
  })

  it('shows error toast on database creation failure', async () => {
    server.use(
      http.post('*/api/databases', () =>
        HttpResponse.json({ error: 'DB quota exceeded' }, { status: 400 }),
      ),
    )
    const { onSuccess } = renderForm()
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    const storageInput = screen.getByLabelText('Storage Size (GB)') as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'failing-db' } })
    fireEvent.change(storageInput, { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      const toasts = useToastStore.getState().toasts
      expect(toasts.some((t) => t.message === 'Operation failed' && t.type === 'error')).toBe(true)
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
