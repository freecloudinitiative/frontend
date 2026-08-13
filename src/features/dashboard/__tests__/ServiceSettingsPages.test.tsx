import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/test/server'
import { ComputeEngineSettingsPage } from '@/features/computeEngine/pages/ComputeEngineSettingsPage'
import { DatabaseSettingsPage } from '@/features/database/pages/DatabaseSettingsPage'
import { IamSettingsPage } from '@/features/iam/pages/IamSettingsPage'
import { BucketSettingsPage } from '@/features/storage/pages/BucketSettingsPage'
import { NetworkSettingsPage } from '@/features/network/pages/NetworkSettingsPage'
import { KubernetesSettingsPage } from '@/features/kubernetes/pages/KubernetesSettingsPage'
import { LoadBalancerSettingsPage } from '@/features/loadBalancer/pages/LoadBalancerSettingsPage'
import { useToastStore } from '@/store/toastStore'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  useToastStore.setState({ toasts: [] })
})
afterAll(() => server.close())

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Service Settings Pages (PR #39)', () => {
  it('renders ComputeEngineSettingsPage and submits updated settings', async () => {
    const handleBack = vi.fn()
    renderWithClient(<ComputeEngineSettingsPage onBack={handleBack} selectedRowId="ce-1" />)

    expect(screen.getByText(/Compute Engine Settings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Hostname/i)).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(useToastStore.getState().toasts.length).toBeGreaterThan(0)
    })
  })

  it('renders DatabaseSettingsPage and submits updated settings', async () => {
    const handleBack = vi.fn()
    renderWithClient(<DatabaseSettingsPage onBack={handleBack} selectedRowId="db-1" />)

    expect(screen.getByText(/Database Settings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Connection Limit/i)).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(useToastStore.getState().toasts.length).toBeGreaterThan(0)
    })
  })

  it('renders IamSettingsPage and submits updated settings', async () => {
    const handleBack = vi.fn()
    renderWithClient(<IamSettingsPage onBack={handleBack} selectedRowId="user-1" />)

    expect(screen.getByText(/IAM Settings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password Expiration/i)).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(useToastStore.getState().toasts.length).toBeGreaterThan(0)
    })
  })

  it('renders BucketSettingsPage and submits updated settings', async () => {
    const handleBack = vi.fn()
    renderWithClient(<BucketSettingsPage onBack={handleBack} selectedRowId="bucket-1" />)

    expect(screen.getByText(/Storage Settings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/CORS Rule Configuration/i)).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(useToastStore.getState().toasts.length).toBeGreaterThan(0)
    })
  })

  it('renders NetworkSettingsPage and submits updated settings', async () => {
    const handleBack = vi.fn()
    renderWithClient(<NetworkSettingsPage onBack={handleBack} selectedRowId="net-1" />)

    expect(screen.getByText(/Network Settings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Custom DNS Servers/i)).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(useToastStore.getState().toasts.length).toBeGreaterThan(0)
    })
  })

  it('renders KubernetesSettingsPage placeholder with planned features', () => {
    const handleBack = vi.fn()
    renderWithClient(<KubernetesSettingsPage onBack={handleBack} />)

    expect(screen.getByText(/^Kubernetes Settings$/i)).toBeInTheDocument()
    expect(screen.getByText(/COMING SOON/i)).toBeInTheDocument()
    expect(screen.getByText(/Node pool scaling policies/i)).toBeInTheDocument()
  })

  it('renders LoadBalancerSettingsPage placeholder with planned features', () => {
    const handleBack = vi.fn()
    renderWithClient(<LoadBalancerSettingsPage onBack={handleBack} />)

    expect(screen.getByText(/^Load Balancer Settings$/i)).toBeInTheDocument()
    expect(screen.getByText(/COMING SOON/i)).toBeInTheDocument()
    expect(screen.getByText(/Target group management/i)).toBeInTheDocument()
  })
})
