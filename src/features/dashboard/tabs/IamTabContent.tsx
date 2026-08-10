import type { RoutedTab } from '@/features/dashboard/constants'

interface IamTabContentProps {
  tab: RoutedTab
}

export function IamTabContent({ tab }: IamTabContentProps) {
  const dim = 'var(--dash-text-dim)'
  const label = 'var(--dash-label)'
  const green = '#7ec87e'
  const amber = '#e8c07d'
  const red = '#e0546a'

  // ── Permissions ───────────────────────────────────────────────────────────
  if (tab === 'permissions') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Assigned Permissions</div>
        <table className="fci-table">
          <thead><tr><th>Resource</th><th>Action</th><th>Effect</th><th>Condition</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>compute.instances.*</td><td>*</td><td style={{ color: green }}>Allow</td><td style={{ color: dim }}>—</td></tr>
            <tr><td style={{ color: label }}>storage.buckets.get</td><td>GET</td><td style={{ color: green }}>Allow</td><td style={{ color: dim }}>region=eu-west</td></tr>
            <tr><td style={{ color: label }}>iam.roles.delete</td><td>DELETE</td><td style={{ color: red }}>Deny</td><td style={{ color: dim }}>—</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── Policies ──────────────────────────────────────────────────────────────
  if (tab === 'policies') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Attached Policies</div>
        <table className="fci-table">
          <thead><tr><th>Policy</th><th>Type</th><th>Attached at</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>ComputeAdminV1</td><td>Managed</td><td style={{ color: dim }}>2026-01-15</td><td style={{ color: green }}>Active</td></tr>
            <tr><td style={{ color: label }}>StorageReadOnly</td><td>Managed</td><td style={{ color: dim }}>2026-03-02</td><td style={{ color: green }}>Active</td></tr>
            <tr><td style={{ color: label }}>DenyIAMDelete</td><td>Custom</td><td style={{ color: dim }}>2026-05-20</td><td style={{ color: amber }}>Review needed</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── Activity ──────────────────────────────────────────────────────────────
  if (tab === 'activity') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Recent Activity</div>
        <div className="fci-console-log">
          <span style={{ color: dim }}>2026-08-10 10:44 UTC</span> <span style={{ color: label }}>root@HEAD</span> — <span style={{ color: green }}>Login</span> from 197.12.34.55<br />
          <span style={{ color: dim }}>2026-08-10 09:12 UTC</span> <span style={{ color: label }}>root@HEAD</span> — <span style={{ color: amber }}>Role updated</span>: ComputeAdmin granted<br />
          <span style={{ color: dim }}>2026-08-09 18:30 UTC</span> <span style={{ color: label }}>ci-bot</span> — <span style={{ color: green }}>API key rotated</span><br />
          <span style={{ color: dim }}>2026-08-09 08:00 UTC</span> <span style={{ color: label }}>root@HEAD</span> — <span style={{ color: green }}>Login</span> from 197.12.34.55<br />
          <span style={{ color: dim }}>2026-08-08 22:14 UTC</span> <span style={{ color: label }}>admin</span> — <span style={{ color: red }}>Failed login</span> from 45.33.10.2<br />
        </div>
      </div>
    )
  }

  return null
}
