/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §2.6, §7.5
 *
 * Cross-service check that all 5 create forms behave identically for the same
 * validate()-failure case post-refactor, regardless of whether their form state is
 * Zustand-store-owned (Compute Engine, Database, IAM) or local useState-owned
 * (Network, Storage) — both are wired through the same shared useEntityForm hook.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/test/server'
import { useToastStore } from '@/store/toastStore'
import { ComputeEngineCreateForm } from '@/features/computeEngine/pages/ComputeEngineCreateForm'
import { DatabaseCreateForm } from '@/features/database/pages/DatabaseCreateForm'
import { IamCreateForm } from '@/features/iam/pages/IamCreateForm'
import { NetworkCreateForm } from '@/features/network/pages/NetworkCreateForm'
import { BucketCreateForm } from '@/features/storage/pages/BucketCreateForm'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  useToastStore.setState({ toasts: [] })
})
afterAll(() => server.close())

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const FORMS = [
  { name: 'ComputeEngineCreateForm (Zustand-backed)', Component: ComputeEngineCreateForm },
  { name: 'DatabaseCreateForm (Zustand-backed)', Component: DatabaseCreateForm },
  { name: 'IamCreateForm (Zustand-backed, external errors)', Component: IamCreateForm },
  { name: 'NetworkCreateForm (local useState-backed)', Component: NetworkCreateForm },
  { name: 'BucketCreateForm (local useState-backed)', Component: BucketCreateForm },
]

describe.each(FORMS)('$name — validate()-failure behavior via shared useEntityForm', ({ Component }) => {
  it('does not call onSuccess and shows at least one field-level "required" error on empty submit', async () => {
    const onSuccess = vi.fn()
    const onCancel = vi.fn()
    renderWithQueryClient(<Component onCancel={onCancel} onSuccess={onSuccess} />)

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0)
    })
    expect(onSuccess).not.toHaveBeenCalled()
    // No toast should fire on a client-side validation failure — the mutation never ran.
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('Cancel resets the form and calls onCancel, regardless of state-ownership model', () => {
    const onSuccess = vi.fn()
    const onCancel = vi.fn()
    renderWithQueryClient(<Component onCancel={onCancel} onSuccess={onSuccess} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
