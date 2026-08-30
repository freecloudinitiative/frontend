import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ComputeEngineCreateForm } from '@/features/computeEngine/pages/ComputeEngineCreateForm'
import { COMPUTE_ENGINE_CONSTRAINTS } from '@/lib/apiConstraints'
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
      <ComputeEngineCreateForm onCancel={onCancel} onSuccess={onSuccess} />
    </QueryClientProvider>,
  )
  return { onSuccess, onCancel }
}

describe('ComputeEngineCreateForm — Toast Integration (PR #25 Test Scenario 4.1 & 9.2)', () => {
  it('describes browser console access without promising SSH keys', () => {
    renderForm()

    expect(screen.getByText('Choose an OS image below. Use the Console tab to open the browser terminal once the instance is running.')).toBeInTheDocument()
    expect(screen.queryByText(/SSH key/i)).not.toBeInTheDocument()
  })

  it('shows expanded sizing options and keeps unavailable choices disabled', () => {
    renderForm()

    const regionSelect = document.querySelector('#ce-create-region') as HTMLElement
    const cpuSelect = document.querySelector('#ce-create-cpu') as HTMLElement
    const memorySelect = document.querySelector('#ce-create-memory') as HTMLElement
    const provisioningModelSelect = document.querySelector('#ce-create-provisioning-model') as HTMLElement
    const protectionSelect = document.querySelector('#ce-create-data-protection') as HTMLElement

    expect(regionSelect).toHaveTextContent('IST')
    expect(cpuSelect).toHaveTextContent('16')
    expect(memorySelect).toHaveTextContent('0.5')

    fireEvent.click(regionSelect)
    fireEvent.click(screen.getByText('ANK'))
    expect(regionSelect).toHaveTextContent('IST')
    expect(screen.getByText('ANK')).toHaveClass('fci-dd-item-disabled')

    fireEvent.click(provisioningModelSelect)
    fireEvent.click(screen.getByText('Dedicated'))
    expect(provisioningModelSelect).toHaveTextContent('Standard')
    expect(screen.getByText('Dedicated')).toHaveClass('fci-dd-item-disabled')

    fireEvent.click(protectionSelect)
    fireEvent.click(screen.getByText('Yes'))
    expect(protectionSelect).toHaveTextContent('No')
    expect(screen.getByText('Yes')).toHaveClass('fci-dd-item-disabled')
  })

  it('uses a free-entry disk field without number steppers and shows the maximum disk size', () => {
    renderForm()

    const diskInput = screen.getByLabelText('Disk (GB)')
    expect(diskInput).toHaveAttribute('type', 'text')
    expect(diskInput).toHaveAttribute('inputmode', 'decimal')
    expect(screen.getByText(new RegExp(`maximum of ${COMPUTE_ENGINE_CONSTRAINTS.diskGib.max} GB`))).toBeInTheDocument()
    expect(document.querySelector('#ce-create-time-to-live')).toHaveAttribute('aria-disabled', 'true')
  })

  it('shows green success toast on Compute Engine creation', async () => {
    const { onSuccess } = renderForm()
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    const diskInput = screen.getByLabelText('Disk (GB)') as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'new-test-ce' } })
    fireEvent.change(diskInput, { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())

    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Compute Engine created successfully')
    expect(toasts[0].type).toBe('success')
  })

  it('shows red error toast on server failure without exposing raw error message', async () => {
    server.use(
      http.post('*/api/compute-engines', () =>
        HttpResponse.json({ error: 'internal server error detail' }, { status: 500 }),
      ),
    )
    const { onSuccess } = renderForm()
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    const diskInput = screen.getByLabelText('Disk (GB)') as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'failing-ce' } })
    fireEvent.change(diskInput, { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      const toasts = useToastStore.getState().toasts
      expect(toasts.some((t) => t.message === 'Operation failed' && t.type === 'error')).toBe(true)
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

describe('ComputeEngineCreateForm — disk range validation', () => {
  const { min, max } = COMPUTE_ENGINE_CONSTRAINTS.diskGib
  const rangeError = `Must be between ${min} and ${max} GB`

  function fillAndSubmit(disk: string) {
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'disk-range-ce' } })
    fireEvent.change(screen.getByLabelText('Disk (GB)'), { target: { value: disk } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
  }

  it('rejects a disk below the minimum without sending a create request', () => {
    const createRequest = vi.fn()
    server.use(http.post('*/api/compute-engines', createRequest))
    renderForm()

    fillAndSubmit(String(min - 1))

    expect(screen.getByText(rangeError)).toBeInTheDocument()
    expect(createRequest).not.toHaveBeenCalled()
  })

  it('rejects a disk above the maximum without sending a create request', () => {
    const createRequest = vi.fn()
    server.use(http.post('*/api/compute-engines', createRequest))
    renderForm()

    fillAndSubmit(String(max + 1))

    expect(screen.getByText(rangeError)).toBeInTheDocument()
    expect(createRequest).not.toHaveBeenCalled()
  })

  it.each([
    ['minimum', min],
    ['maximum', max],
  ])('submits the %s disk boundary', async (_boundary, disk) => {
    let submittedDisk: unknown
    server.use(
      http.post('*/api/compute-engines', async ({ request }) => {
        submittedDisk = ((await request.json()) as { disk?: unknown }).disk
        return HttpResponse.json({ id: 'disk-range-ce' }, { status: 201 })
      }),
    )
    const { onSuccess } = renderForm()

    fillAndSubmit(String(disk))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(submittedDisk).toBe(disk)
  })

  it('keeps the required error for an empty disk', () => {
    const createRequest = vi.fn()
    server.use(http.post('*/api/compute-engines', createRequest))
    renderForm()

    fillAndSubmit('')

    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(createRequest).not.toHaveBeenCalled()
  })
})
