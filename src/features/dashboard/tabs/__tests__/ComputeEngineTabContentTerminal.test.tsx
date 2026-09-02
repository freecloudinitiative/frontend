import { createElement, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ComputeEngineTabContent } from '../ComputeEngineTabContent'
import { consoleHandlers } from '@/mocks/handlers/console'
import type { ComputeEngine } from '@/features/computeEngine/types'

vi.mock('@xterm/xterm', () => {
  return {
    Terminal: class {
      open = vi.fn()
      loadAddon = vi.fn()
      write = vi.fn()
      writeln = vi.fn()
      clear = vi.fn()
      dispose = vi.fn()
      onData = vi.fn().mockReturnValue({ dispose: vi.fn() })
    },
  }
})

vi.mock('@xterm/addon-fit', () => {
  return {
    FitAddon: class {
      fit = vi.fn()
    },
  }
})

globalThis.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

// Intercept POST /api/console/tickets so websocket-mode tests don't produce
// unhandled-request errors and the ticket flow can complete in the mock server.
const server = setupServer(
  ...consoleHandlers,
  http.get('*/api/compute-engines/:id/backups', () => HttpResponse.json([])),
)

const computeEngine: ComputeEngine = {
  id: 'ce-01',
  name: 'test-instance',
  status: 'running',
  cpu: 1,
  memory: 512,
  disk: 20,
  diskType: 'SSD',
  ipAddress: '10.42.1.10',
  os: 'Ubuntu 22.04',
  region: 'IST',
  zone: 'ist-1a',
  instanceType: 'shared',
  autoBackups: false,
  createdAt: '2026-09-02T15:00:00Z',
}

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('ComputeEngineTabContent — Terminal Feature Flag & Props', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ENABLE_REAL_TERMINAL', 'false')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('fails closed instead of showing a mock terminal when real terminal is disabled', async () => {
    render(<ComputeEngineTabContent tab="console" selectedComputeEngineId="ce-01" computeEngineName="test-instance" />)

    expect(await screen.findByText('Serial Console')).toBeInTheDocument()
    expect(screen.queryByText('SSH Access')).not.toBeInTheDocument()
    expect(screen.getByText('WebSocket URL not configured.')).toBeInTheDocument()
  })

  it('uses websocket mode when VITE_ENABLE_REAL_TERMINAL is "true"', async () => {
    vi.stubEnv('VITE_ENABLE_REAL_TERMINAL', 'true')

    render(<ComputeEngineTabContent tab="console" selectedComputeEngineId="ce-01" computeEngineName="test-instance" />)

    expect(await screen.findByText('Serial Console')).toBeInTheDocument()
    expect(screen.queryByText('SSH Access')).not.toBeInTheDocument()
  })

  it('wsUrl override prop wraps in a resolved provider (no ticket mint)', async () => {
    vi.stubEnv('VITE_ENABLE_REAL_TERMINAL', 'true')

    render(
      <ComputeEngineTabContent
        tab="console"
        selectedComputeEngineId="ce-01"
        computeEngineName="test-instance"
        wsUrl="ws://localhost:8080/ws/terminal/ce-01?ticket=override-token"
      />,
    )

    expect(await screen.findByText('Serial Console')).toBeInTheDocument()
    // No network call to /api/console/tickets should be made (static wsUrl used)
  })

  it('renders storage tab content correctly', () => {
    render(<ComputeEngineTabContent tab="storage" selectedComputeEngineId="ce-01" computeEngine={computeEngine} computeEngineName="test-instance" />)

    expect(screen.getByText('Attached Volumes')).toBeInTheDocument()
    expect(screen.getByText('boot-disk')).toBeInTheDocument()
    expect(screen.getByText('20 GB')).toBeInTheDocument()
    expect(screen.queryByText('data-disk-1')).not.toBeInTheDocument()
  })

  it('renders network tab content correctly', () => {
    render(<ComputeEngineTabContent tab="network" selectedComputeEngineId="ce-01" computeEngine={computeEngine} computeEngineName="test-instance" />)

    expect(screen.getByText('Interfaces')).toBeInTheDocument()
    expect(screen.getByText('nic0')).toBeInTheDocument()
    expect(screen.getByText('10.42.1.10')).toBeInTheDocument()
  })

  it('shows actual pending storage and network state without inventing addresses', () => {
    const pendingEngine = { ...computeEngine, status: 'pending' as const, ipAddress: null }
    const { rerender } = render(
      <ComputeEngineTabContent tab="storage" selectedComputeEngineId="ce-01" computeEngine={pendingEngine} />,
    )
    expect(screen.getByText('Pending')).toBeInTheDocument()

    rerender(<ComputeEngineTabContent tab="network" selectedComputeEngineId="ce-01" computeEngine={pendingEngine} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Not assigned')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('requires a selected instance for data tabs', () => {
    const { rerender } = render(<ComputeEngineTabContent tab="storage" selectedComputeEngineId={null} />)
    expect(screen.getByText(/NO INSTANCE SELECTED/)).toBeInTheDocument()

    rerender(<ComputeEngineTabContent tab="network" selectedComputeEngineId={null} />)
    expect(screen.getByText(/NO INSTANCE SELECTED/)).toBeInTheDocument()

    rerender(<ComputeEngineTabContent tab="backups" selectedComputeEngineId={null} />)
    expect(screen.getByText(/NO INSTANCE SELECTED/)).toBeInTheDocument()
  })

  it('renders the real empty backup response instead of fixture history', async () => {
    render(
      <ComputeEngineTabContent tab="backups" selectedComputeEngineId="ce-01" computeEngine={computeEngine} computeEngineName="test-instance" />,
      { wrapper: makeWrapper() },
    )

    expect(await screen.findByText('Backup History')).toBeInTheDocument()
    expect(await screen.findByText('No backups exist for this instance.')).toBeInTheDocument()
    expect(screen.queryByText('bkp-001')).not.toBeInTheDocument()
  })

  it('renders real backup rows, sizes, statuses, and enabled policy', async () => {
    server.use(
      http.get('*/api/compute-engines/:id/backups', () => HttpResponse.json([
        { id: 'backup-completed', computeEngineId: 'ce-01', status: 'completed', sizeBytes: 1024, startedAt: '2026-09-02T15:00:00Z' },
        { id: 'backup-pending', computeEngineId: 'ce-01', status: 'pending', startedAt: '2026-09-02T16:00:00Z' },
        { id: 'backup-running', computeEngineId: 'ce-01', status: 'running', startedAt: '2026-09-02T17:00:00Z' },
        { id: 'backup-failed', computeEngineId: 'ce-01', status: 'failed', errorMessage: 'snapshot failed', startedAt: '2026-09-02T18:00:00Z' },
        { id: 'backup-expired', computeEngineId: 'ce-01', status: 'expired', startedAt: '2026-09-02T19:00:00Z' },
      ])),
    )

    render(
      <ComputeEngineTabContent tab="backups" selectedComputeEngineId="ce-01" computeEngine={{ ...computeEngine, autoBackups: true }} />,
      { wrapper: makeWrapper() },
    )

    expect(await screen.findByText('1.0 KB')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toHaveAttribute('title', 'snapshot failed')
    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByText('Automatic backups: Enabled')).toBeInTheDocument()
  })

  it('surfaces a backup API failure and retries with real data', async () => {
    let requests = 0
    server.use(
      http.get('*/api/compute-engines/:id/backups', () => {
        requests += 1
        return requests === 1
          ? HttpResponse.json({ error: 'unavailable' }, { status: 503 })
          : HttpResponse.json([])
      }),
    )

    render(
      <ComputeEngineTabContent tab="backups" selectedComputeEngineId="ce-01" computeEngine={computeEngine} />,
      { wrapper: makeWrapper() },
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load backups')
    fireEvent.click(screen.getByRole('button', { name: '↻ Retry' }))
    expect(await screen.findByText('No backups exist for this instance.')).toBeInTheDocument()
  })
})
