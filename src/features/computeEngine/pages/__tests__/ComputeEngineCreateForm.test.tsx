import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { ComputeEngineCreateForm } from '@/features/computeEngine/pages/ComputeEngineCreateForm'
import { COMPUTE_ENGINE_CONSTRAINTS } from '@/lib/apiConstraints'
import { useToastStore } from '@/store/toastStore'
import { useComputeEngineStore } from '@/features/computeEngine/store'

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

describe('ComputeEngineCreateForm — provisioning model reflects cluster capability', () => {
  // The create form lives in a Zustand store that outlives a render, so a
  // selection made by one test is still there for the next one. Reset it,
  // or a test that picks Dedicated leaves the next test's trigger showing
  // "Dedicated" alongside the option of the same name.
  beforeEach(() => {
    useComputeEngineStore.getState().resetCreateForm()
  })

  function offerInstanceTypes(...instanceTypes: string[]) {
    server.use(
      http.get('*/api/compute-engines/instance-types', () => HttpResponse.json({ instanceTypes })),
    )
  }

  function submitWith(name: string) {
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } })
    // Disk has no default, so a create with only a name fails validation and
    // never reaches the API.
    fireEvent.change(screen.getByLabelText('Disk (GB)'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
  }

  function captureCreate() {
    const body: { current?: Record<string, unknown> } = {}
    server.use(
      http.post('*/api/compute-engines', async ({ request }) => {
        body.current = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 'instance-type-ce' }, { status: 201 })
      }),
    )
    return body
  }

  // Dedicated needs a Kata node pool. Offering it on a cluster without one
  // produces a create the API rejects, so the option has to follow what the
  // cluster reports rather than a constant in this file.
  it('enables Dedicated once the cluster reports it', async () => {
    offerInstanceTypes('shared', 'dedicated')
    renderForm()

    const provisioningModelSelect = document.querySelector('#ce-create-provisioning-model') as HTMLElement
    // Open once, then wait for the option to re-render as the capability
    // query resolves. Clicking inside waitFor would toggle the dropdown shut
    // on every retry.
    fireEvent.click(provisioningModelSelect)
    await waitFor(() => expect(screen.getByText('Dedicated')).not.toHaveClass('fci-dd-item-disabled'))

    fireEvent.click(screen.getByText('Dedicated'))
    expect(provisioningModelSelect).toHaveTextContent('Dedicated')
  })

  it('keeps Dedicated disabled while capability is still unknown', () => {
    // No handler override and no await: this is the first render, before the
    // query resolves. A brief window where the option is offered and then
    // withdrawn is worse than one where it appears a moment late.
    renderForm()

    const provisioningModelSelect = document.querySelector('#ce-create-provisioning-model') as HTMLElement
    fireEvent.click(provisioningModelSelect)
    expect(screen.getByText('Dedicated')).toHaveClass('fci-dd-item-disabled')
  })

  // The selection was previously stored and never sent, so picking Dedicated
  // would have produced a shared container with nothing to say so.
  it('sends the selected provisioning model as instanceType', async () => {
    offerInstanceTypes('shared', 'dedicated')
    const body = captureCreate()
    const { onSuccess } = renderForm()

    const provisioningModelSelect = document.querySelector('#ce-create-provisioning-model') as HTMLElement
    fireEvent.click(provisioningModelSelect)
    await waitFor(() => expect(screen.getByText('Dedicated')).not.toHaveClass('fci-dd-item-disabled'))

    fireEvent.click(screen.getByText('Dedicated'))
    submitWith('dedicated-ce')

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(body.current?.instanceType).toBe('dedicated')
  })

  it('sends shared for the default Standard model', async () => {
    const body = captureCreate()
    const { onSuccess } = renderForm()

    submitWith('standard-ce')

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(body.current?.instanceType).toBe('shared')
  })
})
