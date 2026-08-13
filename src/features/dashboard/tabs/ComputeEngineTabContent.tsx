import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { RoutedTab } from '@/features/dashboard/constants'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { buildTerminalWsUrl } from '@/lib/websocket'
import { DASH_COLORS } from '@/lib/theme'

import { useIsMobile } from '@/hooks/useIsMobile'
import { BackupHistoryTable } from './shared/BackupHistoryTable'
import { MetricRow } from './shared/MetricRow'
import { MobileFullscreenGate } from './shared/MobileFullscreenGate'

const ComputeEngineMetricsTab = lazy(() => import('./ComputeEngineMetricsTab').then((m) => ({ default: m.ComputeEngineMetricsTab })))
const TerminalView = lazy(() => import('@/components/terminal/TerminalView').then((m) => ({ default: m.TerminalView })))

interface ComputeEngineTabContentProps {
  tab: RoutedTab
  selectedComputeEngineId: string | null
  computeEngineName?: string
  /** Override WebSocket URL; only relevant when VITE_ENABLE_REAL_TERMINAL=true */
  wsUrl?: string
}

export function ComputeEngineTabContent({ tab, selectedComputeEngineId, computeEngineName, wsUrl }: ComputeEngineTabContentProps) {
  const { dim, label, green, amber } = DASH_COLORS

  const isMobile = useIsMobile()
  const [fullscreenTerminal, setFullscreenTerminal] = useState(false)

  // Feature flag: gate WebSocket mode behind VITE_ENABLE_REAL_TERMINAL === "true".
  // Explicit string comparison — never truthy when the var is unset or "false".
  const realTerminalEnabled = import.meta.env.VITE_ENABLE_REAL_TERMINAL === 'true'
  const terminalMode: 'mock' | 'websocket' = realTerminalEnabled ? 'websocket' : 'mock'
  const resolvedWsUrl = useMemo(
    () => (realTerminalEnabled ? (wsUrl ?? (selectedComputeEngineId ? buildTerminalWsUrl(selectedComputeEngineId) : undefined)) : undefined),
    [realTerminalEnabled, wsUrl, selectedComputeEngineId],
  )

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

  // ── Console ──────────────────────────────────────────────────────────────
  if (tab === 'console') {
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
                <TerminalView mode={terminalMode} computeEngineName={computeEngineName} title="Serial Console" wsUrl={resolvedWsUrl} />
              }
              fullscreenContent={
                <TerminalView mode={terminalMode} computeEngineName={computeEngineName} title="Serial Console" wsUrl={resolvedWsUrl} hideActions />
              }
            />
          ) : (
            <TerminalView mode={terminalMode} computeEngineName={computeEngineName} title="Serial Console" wsUrl={resolvedWsUrl} />
          )}
        </Suspense>

        <MetricRow
          title="SSH Access"
          items={[
            { label: 'Host', value: '10.128.0.12', color: label },
            { label: 'Port', value: '22', color: label },
            { label: 'User', value: 'ubuntu', color: label },
            { label: 'Auth', value: 'Key-based', color: green },
          ]}
        />
      </div>
    )
  }

  // ── Storage (Compute Engine tab) ─────────────────────────────────────────────────────
  if (tab === 'storage') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Attached Volumes</div>
        <table className="fci-table">
          <thead><tr><th>Name</th><th>Size</th><th>Type</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>boot-disk</td><td>50 GB</td><td>SSD</td><td style={{ color: green }}>Attached</td></tr>
            <tr><td style={{ color: label }}>data-disk-1</td><td>200 GB</td><td>HDD</td><td style={{ color: green }}>Attached</td></tr>
          </tbody>
        </table>
        <MetricRow
          title="Disk I/O"
          items={[
            { label: 'Read', value: '142 MB/s', color: green },
            { label: 'Write', value: '89 MB/s', color: amber },
            { label: 'IOPS', value: '4 200', color: label },
            { label: 'Latency', value: '0.4 ms', color: green },
          ]}
        />
      </div>
    )
  }

  // ── Network (Compute Engine tab) ─────────────────────────────────────────────────────
  if (tab === 'network') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Interfaces</div>
        <table className="fci-table">
          <thead><tr><th>NIC</th><th>IP (internal)</th><th>IP (external)</th><th>Speed</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>nic0</td><td>10.128.0.12</td><td>34.90.211.44</td><td style={{ color: green }}>10 Gbps</td></tr>
          </tbody>
        </table>
        <MetricRow
          title="Traffic"
          items={[
            { label: 'Ingress', value: '142 Mbps', color: label },
            { label: 'Egress', value: '89 Mbps', color: label },
            { label: 'Dropped', value: '0', color: green },
            { label: 'Errors', value: '0', color: green },
          ]}
        />
      </div>
    )
  }

  // ── Backups ───────────────────────────────────────────────────────────────
  if (tab === 'backups') {
    return <BackupHistoryTable />
  }

  // ── Metrics ───────────────────────────────────────────────────────────────
  if (tab === 'metrics') {
    return (
      <Suspense fallback={<div className="fci-tab-content"><DashboardLoading label="LOADING METRICS..." /></div>}>
        <ComputeEngineMetricsTab selectedComputeEngineId={selectedComputeEngineId} dim={dim} />
      </Suspense>
    )
  }

  return null
}
