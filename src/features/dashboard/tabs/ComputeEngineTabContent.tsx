import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { RoutedTab } from '@/features/dashboard/constants'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { buildTerminalWsUrl } from '@/lib/websocket'
import type { UrlProvider } from '@/lib/websocket'
import { getRuntimeConfig } from '@/lib/runtimeConfig'
import { DASH_COLORS } from '@/lib/theme'
import { mintConsoleTicket } from '@/features/console/api'
import type { ComputeEngine, ComputeEngineBackupStatus } from '@/features/computeEngine/types'
import { useComputeEngineBackups } from '@/features/computeEngine/hooks'
import { formatBytes, formatDateTime, formatStatusLabel } from '@/lib/format'

import { useIsMobile } from '@/hooks/useIsMobile'
import { ErrorRetry } from './shared/ErrorRetry'
import { MobileFullscreenGate } from './shared/MobileFullscreenGate'
import { NoInstanceSelectedFallback } from './shared/NoInstanceSelectedFallback'

const ComputeEngineMetricsTab = lazy(() => import('./ComputeEngineMetricsTab').then((m) => ({ default: m.ComputeEngineMetricsTab })))
const TerminalView = lazy(() => import('@/components/terminal/TerminalView').then((m) => ({ default: m.TerminalView })))

interface ComputeEngineTabContentProps {
  tab: RoutedTab
  selectedComputeEngineId: string | null
  computeEngine?: ComputeEngine | null
  computeEngineName?: string
  /**
   * Override WebSocket URL for tests.
   * When supplied, it is wrapped in a resolved provider so TerminalView's
   * urlProvider contract is satisfied without minting a real ticket.
   * Only used when runtime config `enableRealTerminal` is true.
   */
  wsUrl?: string
}

const BACKUP_STATUS_COLORS: Record<ComputeEngineBackupStatus, string> = {
  pending: DASH_COLORS.amber,
  running: DASH_COLORS.label,
  completed: DASH_COLORS.green,
  failed: '#e0546a',
  expired: DASH_COLORS.dim,
}

function ComputeEngineBackupsTab({ computeEngine }: Readonly<{ computeEngine: ComputeEngine }>) {
  const { data: backups, isLoading, isError, refetch } = useComputeEngineBackups(computeEngine.id)

  if (isError) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Backup History</div>
        <ErrorRetry resourceLabel="backups" onRetry={() => refetch()} />
      </div>
    )
  }

  if (isLoading || !backups) {
    return <div className="fci-tab-content"><DashboardLoading label="LOADING BACKUPS..." /></div>
  }

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Backup History</div>
      {backups.length === 0 ? (
        <div style={{ color: DASH_COLORS.dim }}>No backups exist for this instance.</div>
      ) : (
        <table className="fci-table">
          <thead><tr><th>ID</th><th>Started</th><th>Size</th><th>Status</th></tr></thead>
          <tbody>
            {backups.map((backup) => (
              <tr key={backup.id}>
                <td style={{ color: DASH_COLORS.label }}>{backup.id.slice(0, 8)}</td>
                <td style={{ color: DASH_COLORS.dim }}>{formatDateTime(backup.startedAt)}</td>
                <td>{backup.sizeBytes === undefined ? '—' : formatBytes(backup.sizeBytes)}</td>
                <td style={{ color: BACKUP_STATUS_COLORS[backup.status] }} title={backup.errorMessage}>
                  {formatStatusLabel(backup.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="fci-section-title" style={{ marginTop: 14 }}>Policy</div>
      <div style={{ color: computeEngine.autoBackups ? DASH_COLORS.green : DASH_COLORS.dim }}>
        Automatic backups: {computeEngine.autoBackups ? 'Enabled' : 'Disabled'}
      </div>
    </div>
  )
}

function ComputeEngineConsoleTab({
  selectedComputeEngineId,
  computeEngineName,
  wsUrl,
}: Readonly<Pick<ComputeEngineTabContentProps, 'selectedComputeEngineId' | 'computeEngineName' | 'wsUrl'>>) {
  const isMobile = useIsMobile()
  const [fullscreenTerminal, setFullscreenTerminal] = useState(false)

  // Feature flag: gate WebSocket mode behind the container runtime config, so
  // the Helm ConfigMap can toggle it without rebuilding the image. Parsing is
  // fail-closed in getRuntimeConfig() — never truthy when unset or "false".
  const realTerminalEnabled = getRuntimeConfig().enableRealTerminal

  /**
   * Build a URL provider for TerminalView.
   *
   * - If a wsUrl override was supplied (test / dev), wrap it in an immediately
   *   resolved provider — no ticket mint, no network call.
   * - Otherwise mint a fresh single-use ticket on every call (called once per
   *   connection attempt, including each retry).
   */
  const urlProvider = useMemo<UrlProvider | undefined>(() => {
    if (!realTerminalEnabled) return undefined

    if (wsUrl) {
      // Stable override: wrap the static URL in an async factory.
      return () => Promise.resolve(wsUrl)
    }

    if (!selectedComputeEngineId) return undefined

    // Capture the ID at the time the provider is created so the closure is stable.
    const ceId = selectedComputeEngineId
    return async () => {
      const { ticket } = await mintConsoleTicket(ceId)
      return buildTerminalWsUrl(ceId, ticket)
    }
  }, [realTerminalEnabled, wsUrl, selectedComputeEngineId])

  // useCallback so the reference is stable between renders (avoids spurious
  // useEffect re-runs in TerminalView caused by a new provider identity).
  // NOTE: useMemo already handles stability; useCallback is used for clarity
  // with ESLint rules-of-hooks. The actual provider is derived above.

  useEffect(() => {
    if (!fullscreenTerminal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenTerminal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreenTerminal])

  return (
    <div className="fci-tab-content">
      <Suspense fallback={<DashboardLoading label="LOADING CONSOLE..." />}>
        {isMobile ? (
          <MobileFullscreenGate
            icon="⚡"
            title="Compute Engine Serial Console"
            subtitle="Tap Connect to launch full-screen terminal environment"
            tag={`Terminal: ${computeEngineName ?? 'Compute Engine Console'}`}
            ariaLabel={`Full-screen console for ${computeEngineName ?? 'Compute Engine'}`}
            isOpen={fullscreenTerminal}
            onOpen={() => setFullscreenTerminal(true)}
            onClose={() => setFullscreenTerminal(false)}
            blurredContent={
              <TerminalView computeEngineId={selectedComputeEngineId ?? undefined} computeEngineName={computeEngineName} title="Serial Console" urlProvider={urlProvider} />
            }
            fullscreenContent={
              <TerminalView computeEngineId={selectedComputeEngineId ?? undefined} computeEngineName={computeEngineName} title="Serial Console" urlProvider={urlProvider} hideActions />
            }
          />
        ) : (
          <TerminalView computeEngineId={selectedComputeEngineId ?? undefined} computeEngineName={computeEngineName} title="Serial Console" urlProvider={urlProvider} />
        )}
      </Suspense>
    </div>
  )
}

function ComputeEngineStorageTab({ computeEngine }: Readonly<{ computeEngine: ComputeEngine }>) {
  const { dim, label, green, amber } = DASH_COLORS
  const running = computeEngine.status === 'running'
  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Attached Volumes</div>
      <table className="fci-table">
        <thead><tr><th>Name</th><th>Size</th><th>Type</th><th>Status</th></tr></thead>
        <tbody>
          <tr>
            <td style={{ color: label }}>boot-disk</td>
            <td>{computeEngine.disk} GB</td>
            <td>{computeEngine.diskType}</td>
            <td style={{ color: running ? green : amber }}>
              {running ? 'Attached' : formatStatusLabel(computeEngine.status)}
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ color: dim, marginTop: 14 }}>No additional data volumes are attached.</div>
    </div>
  )
}

function ComputeEngineNetworkTab({ computeEngine }: Readonly<{ computeEngine: ComputeEngine }>) {
  const { label, green, amber } = DASH_COLORS
  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Interfaces</div>
      <table className="fci-table">
        <thead><tr><th>NIC</th><th>IP (internal)</th><th>IP (external)</th><th>Status</th></tr></thead>
        <tbody>
          <tr>
            <td style={{ color: label }}>nic0</td>
            <td>{computeEngine.ipAddress ?? '—'}</td>
            <td>Not assigned</td>
            <td style={{ color: computeEngine.ipAddress ? green : amber }}>
              {computeEngine.ipAddress ? 'Active' : formatStatusLabel(computeEngine.status)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function ComputeEngineTabContent({
  tab,
  selectedComputeEngineId,
  computeEngine,
  computeEngineName,
  wsUrl,
}: Readonly<ComputeEngineTabContentProps>) {
  switch (tab) {
    case 'console':
      return <ComputeEngineConsoleTab selectedComputeEngineId={selectedComputeEngineId} computeEngineName={computeEngineName} wsUrl={wsUrl} />
    case 'storage':
      return computeEngine ? <ComputeEngineStorageTab computeEngine={computeEngine} /> : <NoInstanceSelectedFallback />
    case 'network':
      return computeEngine ? <ComputeEngineNetworkTab computeEngine={computeEngine} /> : <NoInstanceSelectedFallback />
    case 'backups':
      return computeEngine ? <ComputeEngineBackupsTab computeEngine={computeEngine} /> : <NoInstanceSelectedFallback />
    case 'metrics':
      return (
        <Suspense fallback={<div className="fci-tab-content"><DashboardLoading label="LOADING METRICS..." /></div>}>
          <ComputeEngineMetricsTab selectedComputeEngineId={selectedComputeEngineId} dim={DASH_COLORS.dim} />
        </Suspense>
      )
    default:
      return null
  }
}
