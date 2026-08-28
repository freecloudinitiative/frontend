import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/test/server'
import { ComputeEngineSettingsPage } from '@/features/computeEngine/pages/ComputeEngineSettingsPage'
import { getComputeEngines, resetComputeEngineStore } from '@/mocks/data/computeEngines'
import { useToastStore } from '@/store/toastStore'

const queryClients = new Set<QueryClient>()
const pendingRequests = new Set<string>()

async function waitForPendingRequests() {
  while (pendingRequests.size > 0) {
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  server.events.on('request:start', ({ requestId }) => pendingRequests.add(requestId))
  server.events.on('request:end', ({ requestId }) => pendingRequests.delete(requestId))
})
afterEach(async () => {
  await Promise.all(Array.from(queryClients, (queryClient) => queryClient.cancelQueries()))
  queryClients.forEach((queryClient) => queryClient.clear())
  queryClients.clear()
  await waitForPendingRequests()
  server.resetHandlers()
  resetComputeEngineStore()
  useToastStore.setState({ toasts: [] })
})
afterAll(async () => {
  await waitForPendingRequests()
  server.close()
})

describe('ComputeEngineSettingsPage payload contract', () => {
  it('is accepted by the strict service mock', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClients.add(queryClient)
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
