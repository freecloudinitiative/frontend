import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { RoutedTab } from '@/features/dashboard/constants'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { buildTerminalWsUrl } from '@/lib/websocket'

import { useIsMobile } from '@/hooks/useIsMobile'

const VmMetricsTab = lazy(() => import('./VmMetricsTab').then((m) => ({ default: m.VmMetricsTab })))
const TerminalView = lazy(() => import('@/components/terminal/TerminalView').then((m) => ({ default: m.TerminalView })))

interface VmTabContentProps {
  tab: RoutedTab
  selectedVmId: string | null
  vmName?: string
  /** Override WebSocket URL; only relevant when VITE_ENABLE_REAL_TERMINAL=true */
  wsUrl?: string
}

export function VmTabContent({ tab, selectedVmId, vmName, wsUrl }: VmTabContentProps) {
  const dim = 'var(--dash-text-dim)'
  const label = 'var(--dash-label)'
  const green = '#7ec87e'
  const amber = '#e8c07d'

  const isMobile = useIsMobile()
  const [fullscreenTerminal, setFullscreenTerminal] = useState(false)

  // Feature flag: gate WebSocket mode behind VITE_ENABLE_REAL_TERMINAL === "true".
  // Explicit string comparison — never truthy when the var is unset or "false".
  const realTerminalEnabled = import.meta.env.VITE_ENABLE_REAL_TERMINAL === 'true'
  const terminalMode: 'mock' | 'websocket' = realTerminalEnabled ? 'websocket' : 'mock'
  const resolvedWsUrl = useMemo(
    () => (realTerminalEnabled ? (wsUrl ?? (selectedVmId ? buildTerminalWsUrl(selectedVmId) : undefined)) : undefined),
    [realTerminalEnabled, wsUrl, selectedVmId],
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
            <>
              <div className="fci-mobile-blurred-gate">
                <div className="fci-mobile-blurred-content">
                  {!fullscreenTerminal && <TerminalView mode={terminalMode} vmName={vmName} title="Serial Console" wsUrl={resolvedWsUrl} />}
                </div>
                <div className="fci-mobile-connect-gate">
                  <div className="fci-mobile-gate-icon">⚡</div>
                  <div className="fci-mobile-gate-title">VM Serial Console</div>
                  <div className="fci-mobile-gate-subtitle">
                    Tap Connect to launch full-screen terminal environment
                  </div>
                  <button
                    type="button"
                    className="fci-linkbtn fci-mobile-connect-btn"
                    onClick={() => setFullscreenTerminal(true)}
                  >
                    ▶ Connect
                  </button>
                </div>
              </div>

              {fullscreenTerminal && (
                <div
                  className="fci-mobile-fullscreen-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-label={`Full-screen console for ${vmName ?? 'VM'}`}
                >
                  <div className="fci-mobile-modal-header">
                    <span className="fci-mobile-terminal-tag">Terminal: {vmName ?? 'VM Console'}</span>
                    <button
                      type="button"
                      className="fci-linkbtn fci-action-delete fci-mobile-terminal-exit"
                      onClick={() => setFullscreenTerminal(false)}
                      aria-label="Exit full screen mode"
                    >
                      ✕ Exit
                    </button>
                  </div>
                  <div className="fci-mobile-modal-body">
                    <TerminalView mode={terminalMode} vmName={vmName} title="Serial Console" wsUrl={resolvedWsUrl} hideActions />
                  </div>
                </div>
              )}
            </>
          ) : (
            <TerminalView mode={terminalMode} vmName={vmName} title="Serial Console" wsUrl={resolvedWsUrl} />
          )}
        </Suspense>

        <div className="fci-section-title" style={{ marginTop: 8 }}>SSH Access</div>
        <div className="fci-metricrow">
          <div>Host: <span style={{ color: label }}>10.128.0.12</span></div>
          <div>Port: <span style={{ color: label }}>22</span></div>
          <div>User: <span style={{ color: label }}>ubuntu</span></div>
          <div>Auth: <span style={{ color: green }}>Key-based</span></div>
        </div>
      </div>
    )
  }

  // ── Storage (VM tab) ─────────────────────────────────────────────────────
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
        <div className="fci-section-title" style={{ marginTop: 14 }}>Disk I/O</div>
        <div className="fci-metricrow">
          <div>Read: <span style={{ color: green }}>142 MB/s</span></div>
          <div>Write: <span style={{ color: amber }}>89 MB/s</span></div>
          <div>IOPS: <span style={{ color: label }}>4 200</span></div>
          <div>Latency: <span style={{ color: green }}>0.4 ms</span></div>
        </div>
      </div>
    )
  }

  // ── Network (VM tab) ─────────────────────────────────────────────────────
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
        <div className="fci-section-title" style={{ marginTop: 14 }}>Traffic</div>
        <div className="fci-metricrow">
          <div>Ingress: <span style={{ color: label }}>142 Mbps</span></div>
          <div>Egress: <span style={{ color: label }}>89 Mbps</span></div>
          <div>Dropped: <span style={{ color: green }}>0</span></div>
          <div>Errors: <span style={{ color: green }}>0</span></div>
        </div>
      </div>
    )
  }

  // ── Backups ───────────────────────────────────────────────────────────────
  if (tab === 'backups') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Backup History</div>
        <table className="fci-table">
          <thead><tr><th>ID</th><th>Timestamp</th><th>Size</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>bkp-001</td><td style={{ color: dim }}>2026-08-10 02:00 UTC</td><td>18.4 GB</td><td style={{ color: green }}>✓ Complete</td></tr>
            <tr><td style={{ color: label }}>bkp-002</td><td style={{ color: dim }}>2026-08-09 02:00 UTC</td><td>17.9 GB</td><td style={{ color: green }}>✓ Complete</td></tr>
            <tr><td style={{ color: label }}>bkp-003</td><td style={{ color: dim }}>2026-08-08 02:00 UTC</td><td>17.1 GB</td><td style={{ color: amber }}>⚠ Partial</td></tr>
            <tr><td style={{ color: label }}>bkp-004</td><td style={{ color: dim }}>2026-08-07 02:00 UTC</td><td>16.8 GB</td><td style={{ color: green }}>✓ Complete</td></tr>
          </tbody>
        </table>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Policy</div>
        <div className="fci-metricrow">
          <div>Schedule: <span style={{ color: label }}>Daily 02:00 UTC</span></div>
          <div>Retention: <span style={{ color: label }}>30 days</span></div>
          <div>Encryption: <span style={{ color: green }}>AES-256</span></div>
          <div>Next run: <span style={{ color: amber }}>in 14h 00m</span></div>
        </div>
      </div>
    )
  }

  // ── Metrics ───────────────────────────────────────────────────────────────
  if (tab === 'metrics') {
    return (
      <Suspense fallback={<div className="fci-tab-content"><DashboardLoading label="LOADING METRICS..." /></div>}>
        <VmMetricsTab selectedVmId={selectedVmId} dim={dim} />
      </Suspense>
    )
  }

  return null
}

