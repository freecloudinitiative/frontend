import type { RoutedTab } from '@/features/dashboard/constants'

interface NetworkTabContentProps {
  tab: RoutedTab
}

export function NetworkTabContent({ tab }: NetworkTabContentProps) {
  const label = 'var(--dash-label)'
  const green = '#7ec87e'
  const amber = '#e8c07d'
  const red = '#e0546a'

  // ── Firewall ──────────────────────────────────────────────────────────────
  if (tab === 'firewall') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Firewall Rules</div>
        <table className="fci-table">
          <thead><tr><th>Name</th><th>Direction</th><th>Protocol</th><th>Port</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>allow-ssh</td><td>INGRESS</td><td>TCP</td><td>22</td><td style={{ color: green }}>ALLOW</td></tr>
            <tr><td style={{ color: label }}>allow-http</td><td>INGRESS</td><td>TCP</td><td>80, 443</td><td style={{ color: green }}>ALLOW</td></tr>
            <tr><td style={{ color: label }}>deny-all-in</td><td>INGRESS</td><td>*</td><td>*</td><td style={{ color: red }}>DENY</td></tr>
            <tr><td style={{ color: label }}>allow-all-out</td><td>EGRESS</td><td>*</td><td>*</td><td style={{ color: green }}>ALLOW</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── Routes ────────────────────────────────────────────────────────────────
  if (tab === 'routes') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Route Table</div>
        <table className="fci-table">
          <thead><tr><th>Destination</th><th>Next Hop</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>0.0.0.0/0</td><td>internet-gateway</td><td>1000</td><td style={{ color: green }}>Active</td></tr>
            <tr><td style={{ color: label }}>10.128.0.0/20</td><td>local</td><td>900</td><td style={{ color: green }}>Active</td></tr>
            <tr><td style={{ color: label }}>10.200.0.0/16</td><td>vpn-gateway-1</td><td>800</td><td style={{ color: amber }}>Pending</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── Peering ───────────────────────────────────────────────────────────────
  if (tab === 'peering') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">VPC Peering Connections</div>
        <table className="fci-table">
          <thead><tr><th>Peer VPC</th><th>Region</th><th>CIDR</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>vpc-staging</td><td>eu-west1</td><td>10.200.0.0/16</td><td style={{ color: green }}>Active</td></tr>
            <tr><td style={{ color: label }}>vpc-analytics</td><td>us-central1</td><td>10.210.0.0/16</td><td style={{ color: amber }}>Pending</td></tr>
          </tbody>
        </table>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Shared Services</div>
        <div className="fci-metricrow">
          <div>DNS resolution: <span style={{ color: green }}>Enabled</span></div>
          <div>Route export: <span style={{ color: green }}>Enabled</span></div>
          <div>MTU: <span style={{ color: label }}>1460</span></div>
          <div>Encryption: <span style={{ color: amber }}>Optional</span></div>
        </div>
      </div>
    )
  }

  return null
}
