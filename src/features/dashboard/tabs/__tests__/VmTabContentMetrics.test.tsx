import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { getVms } from '@/mocks/data/vms'
import { VmTabContent } from '@/features/dashboard/tabs/VmTabContent'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('VmTabContent — Metrics tab (lazy-loaded VmMetricsTab)', () => {
  it('shows a select-a-VM message and fetches nothing when no VM is selected', async () => {
    const onRequest = vi.fn()
    server.use(
      http.get('*/api/vms/:id/metrics', () => {
        onRequest()
        return HttpResponse.json([])
      }),
    )

    render(<VmTabContent tab="metrics" selectedVmId={null} />, { wrapper: makeWrapper() })
    expect(await screen.findByText(/Select a VM to view metrics/, {}, { timeout: 4000 })).toBeTruthy()
    expect(onRequest).toHaveBeenCalledTimes(0)
  })

  it('lazy-loads the metrics chunk and renders CPU/Memory/Disk charts for a selected VM', async () => {
    const vmId = getVms()[0].id
    render(<VmTabContent tab="metrics" selectedVmId={vmId} />, { wrapper: makeWrapper() })

    await waitFor(() => expect(screen.getByText('Metrics')).toBeTruthy())
    await waitFor(() => expect(screen.getByText('CPU')).toBeTruthy())
    expect(screen.getByText('Memory')).toBeTruthy()
    expect(screen.getByText('Disk')).toBeTruthy()
    expect(screen.getByText('1 hour')).toBeTruthy()
  })
})
