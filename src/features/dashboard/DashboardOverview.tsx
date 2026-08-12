import { useNavigate } from 'react-router-dom'
import {
  SERVICES,
  SERVICE_DATASETS,
  serviceIdToSlug,
  type ServiceId,
} from '@/lib/mockServiceData'
import { useThemeStore } from '@/store/themeStore'
import { useVms } from '@/features/vm/hooks'
import { useDatabases } from '@/features/database/hooks'
import { useIamUsers } from '@/features/iam/hooks'
import { useBuckets } from '@/features/storage/hooks'
import { useNetworks } from '@/features/network/hooks'
import { SERVICE_ICONS } from '@/features/dashboard/icons'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import '@/pages/tui-dashboard.css'

interface OverviewResource {
  label: string
  status: string
  createdAt: string
}

interface OverviewCardData {
  serviceId: ServiceId
  resourceLabel: string
  isLoading: boolean
  resources: OverviewResource[]
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusBreakdown(resources: OverviewResource[]): string {
  if (resources.length === 0) return 'no resources'
  const counts = new Map<string, number>()
  for (const resource of resources) {
    counts.set(resource.status, (counts.get(resource.status) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([status, count]) => `${count} ${capitalize(status)}`)
    .join(', ')
}

function dotColor(serviceId: ServiceId): string {
  const colors = Object.values(SERVICE_DATASETS[serviceId].statusColors)
  return colors[0] ?? 'var(--dash-accent)'
}

const RECENT_ACTIVITY = [
  { service: 'VM', label: 'web-server-03 restarted', time: '4 minutes ago' },
  { service: 'Database', label: 'orders-db backup completed', time: '22 minutes ago' },
  { service: 'IAM', label: 'user jane.doe granted editor role', time: '1 hour ago' },
  { service: 'Storage', label: 'bucket assets-prod created', time: '3 hours ago' },
  { service: 'Network', label: 'firewall rule allow-https added', time: '5 hours ago' },
  { service: 'VM', label: 'api-worker-01 scaled up', time: 'yesterday' },
] as const

const SYSTEM_STATUS = [
  { label: 'API Latency', value: '42ms' },
  { label: 'Uptime', value: '99.98%' },
  { label: 'Active Alerts', value: '0 active alerts' },
] as const

export function DashboardOverview() {
  const navigate = useNavigate()
  const theme = useThemeStore((state) => state.theme)

  const vmsQuery = useVms()
  const databasesQuery = useDatabases()
  const iamUsersQuery = useIamUsers()
  const bucketsQuery = useBuckets()
  const networksQuery = useNetworks()

  const cards: Record<ServiceId, OverviewCardData> = {
    VM: {
      serviceId: 'VM',
      resourceLabel: 'VMs',
      isLoading: vmsQuery.isLoading,
      resources: (vmsQuery.data ?? []).map((vm) => ({ label: vm.name, status: vm.status, createdAt: vm.createdAt })),
    },
    Database: {
      serviceId: 'Database',
      resourceLabel: 'Databases',
      isLoading: databasesQuery.isLoading,
      resources: (databasesQuery.data ?? []).map((db) => ({ label: db.name, status: db.status, createdAt: db.createdAt })),
    },
    IAM: {
      serviceId: 'IAM',
      resourceLabel: 'Users',
      isLoading: iamUsersQuery.isLoading,
      resources: (iamUsersQuery.data ?? []).map((user) => ({ label: user.name, status: user.status, createdAt: user.createdAt })),
    },
    Storage: {
      serviceId: 'Storage',
      resourceLabel: 'Buckets',
      isLoading: bucketsQuery.isLoading,
      resources: (bucketsQuery.data ?? []).map((bucket) => ({ label: bucket.bucketName, status: bucket.status, createdAt: bucket.createdAt })),
    },
    Network: {
      serviceId: 'Network',
      resourceLabel: 'Networks',
      isLoading: networksQuery.isLoading,
      resources: (networksQuery.data ?? []).map((network) => ({ label: network.vpcName, status: network.status, createdAt: network.createdAt })),
    },
  }

  return (
    <div className="fci-page" data-theme={theme}>
      <div className="fci-tui">
        <div className="fci-tui-title">Free Cloud Initiative</div>

        <div className="fci-overview-body">
          <div className="fci-overview-grid">
            {SERVICES.map(({ id }) => {
              const card = cards[id]
              const lastCreated = [...card.resources].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              )[0]

              return (
                <button
                  key={id}
                  type="button"
                  className="fci-box fci-overview-card"
                  onClick={() => navigate(`/services/${serviceIdToSlug(id)}/info`)}
                >
                  <div className="fci-overview-card-head">
                    <span className="fci-overview-dot" style={{ background: dotColor(id) }} aria-hidden="true" />
                    {SERVICE_ICONS[id]}
                    <span className="fci-overview-card-name">{id}</span>
                  </div>

                  {card.isLoading ? (
                    <DashboardLoading />
                  ) : (
                    <>
                      <div className="fci-overview-card-count">
                        {card.resources.length} {card.resourceLabel}
                      </div>
                      <div className="fci-overview-card-breakdown">{statusBreakdown(card.resources)}</div>
                      <div className="fci-overview-card-last">
                        {lastCreated
                          ? `Last created: ${lastCreated.label} (${formatDate(lastCreated.createdAt)})`
                          : 'No resources yet'}
                      </div>
                    </>
                  )}
                </button>
              )
            })}
          </div>

          <div className="fci-box">
            <div className="fci-box-label">Recent Activity</div>
            <ul className="fci-overview-activity-list">
              {RECENT_ACTIVITY.map((activity, index) => (
                <li key={index} className="fci-overview-activity-row">
                  <span>
                    [{activity.service}] {activity.label}
                  </span>
                  <span className="fci-overview-activity-time">{activity.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="fci-box">
            <div className="fci-box-label">System Status</div>
            <div className="fci-overview-status-grid">
              {SYSTEM_STATUS.map((stat) => (
                <div key={stat.label}>
                  <div className="fci-overview-stat-label">{stat.label}</div>
                  <div className="fci-overview-stat-value">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
