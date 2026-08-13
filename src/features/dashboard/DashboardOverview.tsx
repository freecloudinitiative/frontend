import { useNavigate } from 'react-router-dom'
import {
  SERVICES,
  SERVICE_DATASETS,
  serviceIdToSlug,
  type ServiceId,
} from '@/lib/mockServiceData'
import { useThemeStore } from '@/store/themeStore'
import { useComputeEngines } from '@/features/computeEngine/hooks'
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

function formatDateLong(iso: string): string {
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



export function DashboardOverview() {
  const navigate = useNavigate()
  const theme = useThemeStore((state) => state.theme)

  const computeEnginesQuery = useComputeEngines()
  const databasesQuery = useDatabases()
  const iamUsersQuery = useIamUsers()
  const bucketsQuery = useBuckets()
  const networksQuery = useNetworks()

  const cards: Record<ServiceId, OverviewCardData> = {
    'Compute Engine': {
      serviceId: 'Compute Engine',
      resourceLabel: 'Compute Engines',
      isLoading: computeEnginesQuery.isLoading,
      resources: (computeEnginesQuery.data ?? []).map((computeEngine) => ({
        label: computeEngine.name,
        status: computeEngine.status,
        createdAt: computeEngine.createdAt,
      })),
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
    'Load Balancer': {
      serviceId: 'Load Balancer',
      resourceLabel: 'Load Balancers',
      isLoading: false,
      resources: [],
    },
    Kubernetes: {
      serviceId: 'Kubernetes',
      resourceLabel: 'Clusters',
      isLoading: false,
      resources: [],
    },
  }

  return (
    <div className="fci-page" data-theme={theme}>
      <div className="fci-tui">
        <div className="fci-overview-body">
          <div className="fci-plain-banner">
            <span className="fci-banner-bracket">[</span>FREE CLOUD INITIATIVE<span className="fci-banner-bracket">]</span>
          </div>

          <div className="fci-manifesto-container">
            <div className="fci-manifesto-subtitle">» SECTION 42: DON'T PANIC (A BRIEF HISTORY OF CLOUD MADNESS)</div>
            <p>
              Far out in the uncharted backwaters of the unfashionable end of the western spiral arm of the Galaxy lies a small, unregarded blue-green planet called Earth. Its inhabitants once believed that managing a computer server meant opening a terminal and typing a single command.
            </p>
            <p>
              Then came the Great Enterprise Cloud Explosion. Engineers who just wanted to host a static HTML page found themselves forced to navigate 450MB JavaScript single-page applications, 14 nested loading spinner frameworks, 38 IAM permission wizards, and 87 confirmation modals—all running on a web console that consumes more RAM than the Apollo 11 guidance computer.
            </p>
            <p>
              According to the <em>Hitchhiker's Guide to Cloud Infrastructure</em>, generations of sysadmins spent their entire adult lives waiting for cloud dashboard dropdown menus to hydrate. Many died of old age before their Kubernetes cluster status indicator turned green.
            </p>
            <p style={{ color: 'var(--dash-accent)', fontWeight: 600 }}>
              » This initiative was forged under the ancient galactic principle that constructing a hyperspace bypass—or provisioning a virtual server—should never require a three-minute initial load time while wearing a wet towel.
            </p>
          </div>

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
                          ? `Last created: ${lastCreated.label} (${formatDateLong(lastCreated.createdAt)})`
                          : 'No resources yet'}
                      </div>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
