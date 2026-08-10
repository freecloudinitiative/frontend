import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RoutedTab } from '@/features/dashboard/constants'
import { useVmMetrics } from '@/features/vm/hooks'
import type { MetricRange } from '@/features/vm/types'

interface VmTabContentProps {
  tab: RoutedTab
  selectedVmId: string | null
}

export function VmTabContent({ tab, selectedVmId }: VmTabContentProps) {
  const dim = 'var(--dash-text-dim)'
  const label = 'var(--dash-label)'
  const green = '#7ec87e'
  const amber = '#e8c07d'

  // ── Console ──────────────────────────────────────────────────────────────
  if (tab === 'console') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Serial Console Output</div>
        <div className="fci-console-log">
          <span style={{ color: dim }}>[  0.000000]</span> Linux version 6.1.0-gcp (Debian 6.1.109)<br />
          <span style={{ color: dim }}>[  0.000023]</span> <span style={{ color: green }}>BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable</span><br />
          <span style={{ color: dim }}>[  1.342100]</span> eth0: renamed from veth9a2c<br />
          <span style={{ color: dim }}>[  3.821044]</span> <span style={{ color: green }}>systemd[1]: Started OpenSSH server daemon.</span><br />
          <span style={{ color: dim }}>[  4.210311]</span> systemd[1]: Reached target <span style={{ color: amber }}>Multi-User System</span>.<br />
          <span style={{ color: dim }}>[  4.990211]</span> <span style={{ color: green }}>cloud-init[834]: Cloud-init v.23.3.1 finished</span><br />
          <span style={{ color: dim }}>[  5.002344]</span> kernel: audit: type=1400 audit(1691600000.123:2): apparmor="STATUS"<br />
        </div>
        <div className="fci-section-title" style={{ marginTop: 14 }}>SSH Access</div>
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
    return <VmMetricsTab selectedVmId={selectedVmId} dim={dim} />
  }

  return null
}

const RANGE_OPTIONS: { value: MetricRange; label: string }[] = [
  { value: '30m', label: 'Last 30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '3h', label: '3 hours' },
  { value: '1w', label: '1 week' },
]

function formatTimeLabel(timestamp: string, range: MetricRange) {
  const date = new Date(timestamp)
  if (range === '1w') {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
  }
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function MetricChart({
  title,
  color,
  data,
}: {
  title: string
  color: string
  data: { time: string; value: number }[]
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div className="fci-section-title">{title}</div>
      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="var(--dash-border-subtle)" strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke="var(--dash-text-dim)" tick={{ fill: 'var(--dash-text-dim)', fontSize: 11 }} />
            <YAxis
              domain={[0, 100]}
              unit="%"
              stroke="var(--dash-text-dim)"
              tick={{ fill: 'var(--dash-text-dim)', fontSize: 11 }}
              width={40}
            />
            <Tooltip
              contentStyle={{ background: '#0a0a0a', border: '1px solid var(--dash-border-subtle)' }}
              labelStyle={{ color: 'var(--dash-text)' }}
            />
            <Line type="monotone" dataKey="value" name={title} stroke={color} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function VmMetricsTab({ selectedVmId, dim }: { selectedVmId: string | null; dim: string }) {
  const [range, setRange] = useState<MetricRange>('1h')
  const { data: metrics, isLoading } = useVmMetrics(selectedVmId ?? undefined, range)

  const rangeSelector = (
    <div className="fci-range-selector">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={opt.value === range ? 'fci-range-btn fci-range-btn-active' : 'fci-range-btn'}
          onClick={() => setRange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )

  if (!selectedVmId) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        <div style={{ color: dim }}>Select a VM to view metrics</div>
      </div>
    )
  }

  if (isLoading || !metrics) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        {rangeSelector}
        <div className="fci-blink" style={{ color: dim, marginTop: 14 }}>⏳ Loading metrics…</div>
      </div>
    )
  }

  const cpuData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp, range), value: point.cpu }))
  const memoryData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp, range), value: point.memory }))
  const diskData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp, range), value: point.disk }))

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Metrics</div>
      {rangeSelector}
      <MetricChart title="CPU" color="#4fa8dc" data={cpuData} />
      <MetricChart title="Memory" color="#e8c07d" data={memoryData} />
      <MetricChart title="Disk" color="#7ec87e" data={diskData} />
    </div>
  )
}
