import type { RoutedTab } from '@/features/dashboard/constants'
import type { IamUserWithPolicies } from '@/features/iam/types'
import { DASH_COLORS } from '@/lib/theme'
import { formatDate } from '@/lib/format'
import { NoInstanceSelectedFallback } from './shared/NoInstanceSelectedFallback'

interface IamTabContentProps {
  tab: RoutedTab
  iamUserWithPolicies?: IamUserWithPolicies | null
}

export function IamTabContent({ tab, iamUserWithPolicies }: IamTabContentProps) {
  const { dim, label, green, amber, red } = DASH_COLORS

  // ── Permissions ───────────────────────────────────────────────────────────
  if (tab === 'permissions') {
    // Flatten all permissions from all policies on the selected user
    const allPermissions = iamUserWithPolicies
      ? iamUserWithPolicies.policies.flatMap((policy) => policy.permissions)
      : null

    if (!iamUserWithPolicies) {
      return <NoInstanceSelectedFallback />
    }

    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Assigned Permissions</div>
        {allPermissions && allPermissions.length > 0 ? (
          <table className="fci-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Action</th>
                <th>Effect</th>
                <th>Condition</th>
              </tr>
            </thead>
            <tbody>
              {allPermissions.map((perm, idx) => (
                <tr key={idx}>
                  <td style={{ color: label }}>{perm.resource}</td>
                  <td>{perm.action}</td>
                  <td style={{ color: perm.effect === 'allow' ? green : red }}>
                    {perm.effect === 'allow' ? 'Allow' : 'Deny'}
                  </td>
                  <td style={{ color: dim }}>{perm.condition ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: dim, padding: '1rem 0', fontSize: '0.85rem' }}>
            No permissions assigned.
          </div>
        )}
      </div>
    )
  }

  // ── Policies ──────────────────────────────────────────────────────────────
  if (tab === 'policies') {
    if (!iamUserWithPolicies) {
      return (
        <div className="fci-tab-content">
          <div className="fci-section-title">Attached Policies</div>
          <div style={{ color: dim, padding: '1.5rem 0', fontSize: '0.85rem' }}>
            Select a user to view attached policies.
          </div>
        </div>
      )
    }

    const policies = iamUserWithPolicies.policies

    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Attached Policies</div>
        {policies.length > 0 ? (
          <table className="fci-table">
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Type</th>
                <th>Attached At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id}>
                  <td style={{ color: label }}>{policy.name}</td>
                  <td>
                    {policy.type === 'managed' ? 'Managed' : 'Custom'}
                  </td>
                  <td style={{ color: dim }}>
                    {formatDate(policy.attachedAt)}
                  </td>
                  <td
                    style={{
                      color: policy.status === 'active' ? green : amber,
                    }}
                  >
                    {policy.status === 'active' ? 'Active' : 'Review needed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: dim, padding: '1rem 0', fontSize: '0.85rem' }}>
            No policies attached.
          </div>
        )}
      </div>
    )
  }

  // ── Activity ──────────────────────────────────────────────────────────────
  if (tab === 'activity') {
    // TODO: No activity endpoint exists yet — entries are hardcoded.
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Recent Activity</div>
        <div className="fci-console-log">
          <div className="fci-log-entry">
            <span className="fci-log-timestamp">2026-08-10 10:44 UTC</span>{' '}
            <span className="fci-log-user">root@HEAD</span> —{' '}
            <span className="fci-log-badge fci-log-info">Login</span> <span className="fci-log-msg">from 197.12.34.55</span>
          </div>
          <div className="fci-log-entry">
            <span className="fci-log-timestamp">2026-08-10 09:12 UTC</span>{' '}
            <span className="fci-log-user">root@HEAD</span> —{' '}
            <span className="fci-log-badge fci-log-warn">Role updated</span>: <span className="fci-log-msg">ComputeAdmin granted</span>
          </div>
          <div className="fci-log-entry">
            <span className="fci-log-timestamp">2026-08-09 18:30 UTC</span>{' '}
            <span className="fci-log-user">ci-bot</span> —{' '}
            <span className="fci-log-badge fci-log-info">API key rotated</span>
          </div>
          <div className="fci-log-entry">
            <span className="fci-log-timestamp">2026-08-09 08:00 UTC</span>{' '}
            <span className="fci-log-user">root@HEAD</span> —{' '}
            <span className="fci-log-badge fci-log-info">Login</span> <span className="fci-log-msg">from 197.12.34.55</span>
          </div>
          <div className="fci-log-entry">
            <span className="fci-log-timestamp">2026-08-08 22:14 UTC</span>{' '}
            <span className="fci-log-user">admin</span> —{' '}
            <span className="fci-log-badge fci-log-error">Failed login</span> <span className="fci-log-msg">from 45.33.10.2</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}
