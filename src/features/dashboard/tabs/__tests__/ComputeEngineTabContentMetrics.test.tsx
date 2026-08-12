import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { getComputeEngines } from '@/mocks/data/computeEngines'
import { ComputeEngineTabContent } from '@/features/dashboard/tabs/ComputeEngineTabContent'

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

describe('ComputeEngineTabContent — Metrics tab (lazy-loaded ComputeEngineMetricsTab)', () => {
  it('shows a select-a-Compute Engine message and fetches nothing when no Compute Engine is selected', async () => {
    const onRequest = vi.fn()
    server.use(
      http.get('*/api/compute-engines/:id/metrics', () => {
        onRequest()
        return HttpResponse.json([])
      }),
    )

    render(<ComputeEngineTabContent tab="metrics" selectedComputeEngineId={null} />, { wrapper: makeWrapper() })
    expect(await screen.findByText(/Select a Compute Engine to view metrics/, {}, { timeout: 4000 })).toBeTruthy()
    expect(onRequest).toHaveBeenCalledTimes(0)
  })

  it('lazy-loads the metrics chunk and renders CPU/Memory/Disk charts for a selected Compute Engine', async () => {
    const computeEngineId = getComputeEngines()[0].id
    render(<ComputeEngineTabContent tab="metrics" selectedComputeEngineId={computeEngineId} />, { wrapper: makeWrapper() })

    await waitFor(() => expect(screen.getByText('Metrics')).toBeTruthy())
    await waitFor(() => expect(screen.getByText('CPU')).toBeTruthy())
    expect(screen.getByText('Memory')).toBeTruthy()
    expect(screen.getByText('Disk')).toBeTruthy()
    expect(screen.getByText('1 hour')).toBeTruthy()
  })
})
