import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '@/pages/DashboardPage'
import { useToastStore } from '@/store/toastStore'

const hookMocks = vi.hoisted(() => ({ refetch: vi.fn() }))

const queryResult = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
  refetch: hookMocks.refetch,
}

vi.mock('@/features/computeEngine/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useComputeEngines: () => queryResult,
}))
vi.mock('@/features/database/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useDatabases: () => queryResult,
}))
vi.mock('@/features/iam/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useIamUsers: () => queryResult,
  useIamUser: () => queryResult,
}))
vi.mock('@/features/storage/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useBuckets: () => queryResult,
}))
vi.mock('@/features/network/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useNetworks: () => queryResult,
}))

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

function renderDashboard(serviceSlug: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/services/${serviceSlug}/info`]}>
        <LocationProbe />
        <Routes>
          <Route path="/services/:serviceId/:tab" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('unavailable dashboard service actions', () => {
  beforeEach(() => {
    hookMocks.refetch.mockClear()
    useToastStore.setState({ toasts: [] })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    ['load-balancer', 'Load Balancer'],
    ['kubernetes', 'Kubernetes'],
    ['elasticsearch', 'Elasticsearch'],
    ['kafka', 'Kafka'],
  ])('does not refetch the %s placeholder service', (serviceSlug, serviceName) => {
    renderDashboard(serviceSlug)

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(hookMocks.refetch).not.toHaveBeenCalled()
    expect(useToastStore.getState().toasts.at(-1)?.message).toBe(
      `Refresh is not available for ${serviceName}`,
    )
  })

  it('still refreshes an available service', async () => {
    hookMocks.refetch.mockResolvedValue(undefined)
    renderDashboard('compute-engine')

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    await waitFor(() => expect(hookMocks.refetch).toHaveBeenCalledTimes(1))
    expect(useToastStore.getState().toasts.at(-1)?.message).toBe('Service dataset refreshed')
  })

  it('reports unavailable create and settings actions for Elasticsearch', () => {
    renderDashboard('elasticsearch')

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(useToastStore.getState().toasts.map(({ message }) => message)).toEqual([
      'Elasticsearch creation is coming soon',
      'Elasticsearch settings are coming soon',
    ])
  })

  it('asks for an instance selection before opening available settings', () => {
    renderDashboard('compute-engine')

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/services/compute-engine/info')
    expect(useToastStore.getState().toasts.at(-1)?.message).toBe('Please select an instance')
  })

  it('opens the project GitHub link', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderDashboard('elasticsearch')

    fireEvent.click(screen.getByRole('button', { name: 'GitHub' }))

    expect(open).toHaveBeenCalledWith(
      'https://github.com/freecloudinitiative',
      '_blank',
      'noopener,noreferrer',
    )
  })
})
