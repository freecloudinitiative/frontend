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
import { http, HttpResponse } from 'msw'

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
    let requestBody: unknown
    server.use(http.patch('*/api/compute-engines/ce-1/settings', async ({ request }) => {
      requestBody = JSON.parse(await request.text())
      return HttpResponse.json({})
    }))
    const handleBack = vi.fn()
    renderWithClient(<ComputeEngineSettingsPage onBack={handleBack} selectedRowId="ce-1" />)

    expect(screen.getByText(/Compute Engine Settings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Hostname/i)).toBeInTheDocument()
    expect(screen.getByText(/nightly/i)).toBeInTheDocument()
    expect(screen.getByText(/crash-consistent/i)).toBeInTheDocument()
    expect(screen.getByText(/7 days/i)).toBeInTheDocument()
    expect(screen.getByText(/not continuous/i)).toBeInTheDocument()
    expect(screen.getByText(/point-in-time/i)).toBeInTheDocument()
    expect(screen.getByText(/application-consistent/i)).toBeInTheDocument()
    expect(screen.getByText(/customer-facing restore is not available/i)).toBeInTheDocument()

    expect(screen.getByLabelText(/Hostname/i)).toBeDisabled()
    expect(screen.getByLabelText(/Instance Tagging/i)).toBeDisabled()
    const cpuLimitSelect = document.querySelector('#ce-cpu-limit') as HTMLElement
    expect(cpuLimitSelect).toHaveTextContent('16 cores')
    expect(cpuLimitSelect).toHaveAttribute('aria-disabled', 'true')

    const submitBtn = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(requestBody).toEqual({ autoBackups: true })
    })
  })

  it('renders DatabaseSettingsPage and submits updated settings', async () => {
    let requestBody: unknown
    server.use(
      http.get('*/api/databases/db-1', () => HttpResponse.json({
        id: 'db-1', name: 'primary', cpu: 2, memory: 4, storageSize: 20, status: 'running',
      })),
      http.patch('*/api/databases/db-1/settings', async ({ request }) => {
        requestBody = JSON.parse(await request.text())
        return HttpResponse.json({})
      }),
    )
    const handleBack = vi.fn()
    renderWithClient(<DatabaseSettingsPage onBack={handleBack} selectedRowId="db-1" />)

    expect(screen.getByText(/Database Settings/i)).toBeInTheDocument()
    const storageSize = screen.getByLabelText(/Storage Size/i)
    await waitFor(() => expect(storageSize).toHaveValue(20))
    expect(storageSize).toHaveAttribute('min', '20')
    expect(document.querySelector('#db-settings-cpu')).toBeInTheDocument()
    expect(document.querySelector('#db-settings-memory')).toBeInTheDocument()
    expect(document.querySelector('#db-settings-status')).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(requestBody).toEqual({ cpu: 2, memory: 4, storageSize: 20, status: 'running' })
    })
  })

  it('prevents a database storage-size decrease', async () => {
    let requestCount = 0
    server.use(
      http.get('*/api/databases/db-shrink', () => HttpResponse.json({
        id: 'db-shrink', name: 'primary', cpu: 2, memory: 4, storageSize: 20, status: 'running',
      })),
      http.patch('*/api/databases/db-shrink/settings', () => {
        requestCount += 1
        return HttpResponse.json({})
      }),
    )
    renderWithClient(<DatabaseSettingsPage onBack={vi.fn()} selectedRowId="db-shrink" />)

    const storageSize = screen.getByLabelText(/Storage Size/i)
    await waitFor(() => expect(storageSize).toHaveValue(20))
    fireEvent.change(storageSize, { target: { value: '19' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }))

    expect(await screen.findByText(/Storage size must be at least 20 GB/i)).toBeInTheDocument()
    expect(requestCount).toBe(0)
  })

  it('renders IamSettingsPage and submits updated settings', async () => {
    let requestBody: unknown
    server.use(http.patch('*/api/iam/users/user-1/settings', async ({ request }) => {
      requestBody = JSON.parse(await request.text())
      return HttpResponse.json({})
    }))
    const handleBack = vi.fn()
    renderWithClient(<IamSettingsPage onBack={handleBack} selectedRowId="user-1" />)

    expect(screen.getByText(/IAM Settings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password Expiration/i)).toBeDisabled()
    expect(screen.getByLabelText(/Session Timeout/i)).toBeDisabled()

    const submitBtn = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(requestBody).toEqual({ mfaEnabled: true })
    })
  })

  it('renders BucketSettingsPage and submits updated settings', async () => {
    let requestBody: unknown
    server.use(http.patch('*/api/buckets/bucket-1/settings', async ({ request }) => {
      requestBody = JSON.parse(await request.text())
      return HttpResponse.json({})
    }))
    const handleBack = vi.fn()
    renderWithClient(<BucketSettingsPage onBack={handleBack} selectedRowId="bucket-1" />)

    expect(screen.getByText(/Storage Settings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/CORS Rule Configuration/i)).toBeDisabled()

    const submitBtn = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(requestBody).toEqual({ versioning: true, publicReadAccess: false })
    })
  })

  it('renders NetworkSettingsPage and submits updated settings', async () => {
    let requestBody: unknown
    server.use(
      http.get('*/api/networks/net-1', () => HttpResponse.json({
        id: 'net-1', vpcName: 'primary', gateway: '10.0.0.1',
      })),
      http.patch('*/api/networks/net-1/settings', async ({ request }) => {
        requestBody = JSON.parse(await request.text())
        return HttpResponse.json({})
      }),
    )
    const handleBack = vi.fn()
    renderWithClient(<NetworkSettingsPage onBack={handleBack} selectedRowId="net-1" />)

    expect(screen.getByText(/Network Settings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Custom DNS Servers/i)).toBeDisabled()
    expect(document.querySelector('#net-auto-cidr')).toHaveAttribute('aria-disabled', 'true')
    await waitFor(() => expect(screen.getByLabelText(/Default Gateway IP/i)).toHaveValue('10.0.0.1'))

    const submitBtn = screen.getByRole('button', { name: /Save Settings/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(requestBody).toEqual({})
    })
  })

  it('validates a changed network gateway before sending it', async () => {
    let requestCount = 0
    let requestBody: unknown
    server.use(
      http.get('*/api/networks/net-validated', () => HttpResponse.json({
        id: 'net-validated',
        vpcName: 'primary',
        gateway: '10.0.0.1',
      })),
      http.patch('*/api/networks/net-validated/settings', async ({ request }) => {
        requestCount += 1
        requestBody = JSON.parse(await request.text())
        return HttpResponse.json({})
      }),
    )
    renderWithClient(<NetworkSettingsPage onBack={vi.fn()} selectedRowId="net-validated" />)

    const gateway = await screen.findByLabelText(/Default Gateway IP/i)
    await waitFor(() => expect(gateway).toHaveValue('10.0.0.1'))
    fireEvent.change(gateway, { target: { value: '999.1.1.1' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }))

    expect(await screen.findByText(/Enter a valid IP address/i)).toBeInTheDocument()
    expect(requestCount).toBe(0)

    fireEvent.change(gateway, { target: { value: '10.0.0.254' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }))
    await waitFor(() => expect(requestBody).toEqual({ gateway: '10.0.0.254' }))
  })

  it('omits a cleared network gateway instead of sending null or an empty string', async () => {
    let requestBody: unknown
    server.use(
      http.get('*/api/networks/net-cleared', () => HttpResponse.json({
        id: 'net-cleared', vpcName: 'primary', gateway: '10.0.0.1',
      })),
      http.patch('*/api/networks/net-cleared/settings', async ({ request }) => {
        requestBody = JSON.parse(await request.text())
        return HttpResponse.json({})
      }),
    )
    renderWithClient(<NetworkSettingsPage onBack={vi.fn()} selectedRowId="net-cleared" />)

    const gateway = screen.getByLabelText(/Default Gateway IP/i)
    await waitFor(() => expect(gateway).toHaveValue('10.0.0.1'))
    fireEvent.change(gateway, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }))

    await waitFor(() => expect(requestBody).toEqual({}))
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
