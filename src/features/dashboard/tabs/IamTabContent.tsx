import type { RoutedTab } from '@/features/dashboard/constants'
import type { IamUserWithPolicies } from '@/features/iam/types'
import { DASH_COLORS } from '@/lib/theme'
import { formatDate } from '@/lib/format'
import { useIamUserActivity } from '@/features/iam/hooks'
import { NoInstanceSelectedFallback } from './shared/NoInstanceSelectedFallback'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { ErrorRetry } from './shared/ErrorRetry'

interface IamTabContentProps {
  tab: RoutedTab
  iamUserWithPolicies?: IamUserWithPolicies | null
}

export function IamTabContent({ tab, iamUserWithPolicies }: IamTabContentProps) {
  const { dim, label, green, amber, red } = DASH_COLORS
  const { data: activityEntries = [], isLoading, isError, refetch } = useIamUserActivity(iamUserWithPolicies?.id)

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
    if (!iamUserWithPolicies) {
      return <NoInstanceSelectedFallback />
    }

    if (isLoading) {
      return (
        <div className="fci-tab-content">
          <div className="fci-section-title">Recent Activity</div>
          <div style={{ padding: '1.5rem 0' }}>
            <DashboardLoading label="ACTIVITY" />
          </div>
        </div>
      )
    }

    if (isError) {
      return (
        <div className="fci-tab-content">
          <div className="fci-section-title">Recent Activity</div>
          <ErrorRetry resourceLabel="activity" onRetry={() => refetch()} />
        </div>
      )
    }

    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Recent Activity</div>
        {activityEntries.length > 0 ? (
          <div className="fci-console-log">
            {activityEntries.map((entry) => {
              const badgeClass = entry.status === 'success' ? 'fci-log-info' : 'fci-log-error'
              const statusText = entry.status === 'success' ? 'Success' : 'Failed'
              return (
                <div key={entry.id} className="fci-log-entry">
                  <span className="fci-log-timestamp">{formatDate(entry.timestamp)}</span> —{' '}
                  <span className={`fci-log-badge ${badgeClass}`}>{statusText}</span> <span className="fci-log-msg">{entry.action} {entry.resource}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ color: dim, padding: '1rem 0', fontSize: '0.85rem' }}>
            No activity recorded.
          </div>
        )}
      </div>
    )
  }

  return null
}
