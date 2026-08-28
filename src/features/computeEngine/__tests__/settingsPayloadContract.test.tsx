import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/test/server'
import { ComputeEngineSettingsPage } from '@/features/computeEngine/pages/ComputeEngineSettingsPage'
import { getComputeEngines, resetComputeEngineStore } from '@/mocks/data/computeEngines'
import { useToastStore } from '@/store/toastStore'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetComputeEngineStore()
  useToastStore.setState({ toasts: [] })
})
afterAll(() => server.close())

describe('ComputeEngineSettingsPage payload contract', () => {
  it('is accepted by the strict service mock', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const id = getComputeEngines()[0].id

    render(
      <QueryClientProvider client={queryClient}>
        <ComputeEngineSettingsPage onBack={() => undefined} selectedRowId={id} />
      </QueryClientProvider>,
    )

    await screen.findByText(/Compute Engine Settings —/i)
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }))

    await waitFor(() => {
      expect(useToastStore.getState().toasts).toEqual(expect.arrayContaining([
        expect.objectContaining({ message: expect.stringMatching(/Compute Engine settings updated/i) }),
      ]))
    })
  })
})
