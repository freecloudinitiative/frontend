import type { RoutedTab } from '@/features/dashboard/constants'

interface VmTabContentProps {
  tab: RoutedTab
}

export function VmTabContent({ tab }: VmTabContentProps) {
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
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">CPU &amp; Memory</div>
        <div className="fci-metricrow">
          <div>CPU avg (1h): <span style={{ color: green }}>32%</span></div>
          <div>CPU peak: <span style={{ color: amber }}>71%</span></div>
          <div>Mem used: <span style={{ color: amber }}>58%</span></div>
          <div>Mem free: <span style={{ color: green }}>42%</span></div>
        </div>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Disk</div>
        <div className="fci-metricrow">
          <div>Read: <span style={{ color: label }}>142 MB/s</span></div>
          <div>Write: <span style={{ color: label }}>89 MB/s</span></div>
          <div>IOPS: <span style={{ color: label }}>4 200</span></div>
          <div>Latency: <span style={{ color: green }}>0.4 ms</span></div>
        </div>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Uptime</div>
        <div className="fci-metricrow">
          <div>SLA: <span style={{ color: green }}>99.98%</span></div>
          <div>Last incident: <span style={{ color: dim }}>14 days ago</span></div>
          <div>Alerts (open): <span style={{ color: '#e0546a' }}>2</span></div>
          <div>Alerts (7d): <span style={{ color: amber }}>5</span></div>
        </div>
      </div>
    )
  }

  return null
}
