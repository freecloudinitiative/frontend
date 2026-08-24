import { lazy, Suspense, useMemo } from 'react'
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getSortedRowModel,
  useLegacyTable as useReactTable,
  type LegacyColumnDef as ColumnDef,
} from '@tanstack/react-table/legacy'
import {
  SERVICE_DATASETS,
  type ServiceId,
  type ServiceRow,
} from '@/features/dashboard/serviceCatalog'
import { formatBytes, formatDate, formatStatusLabel, resolveStatusColor } from '@/lib/format'
import type { ComputeEngine } from '@/features/computeEngine/types'
import type { Database } from '@/features/database/types'
import type { IamUser, IamUserWithPolicies, IamPolicy } from '@/features/iam/types'
import type { Bucket } from '@/features/storage/types'
import type { Network } from '@/features/network/types'
import { SERVICE_TABS, type RoutedTab } from '@/features/dashboard/constants'
import { SERVICE_CONTENT } from '@/constants/serviceContent'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { ComingSoonTabContent } from '@/features/dashboard/tabs/ComingSoonTabContent'
import { AnimatedPlaceholder } from '@/features/dashboard/tabs/shared/AnimatedPlaceholder'
import { IconButton } from '@/components/ui/IconButton'
import type { CopyState } from '@/features/database/store'

const ComputeEngineTabContent = lazy(() => import('@/features/dashboard/tabs/ComputeEngineTabContent').then((m) => ({ default: m.ComputeEngineTabContent })))
const DatabaseTabContent = lazy(() => import('@/features/dashboard/tabs/DatabaseTabContent').then((m) => ({ default: m.DatabaseTabContent })))
const IamTabContent = lazy(() => import('@/features/dashboard/tabs/IamTabContent').then((m) => ({ default: m.IamTabContent })))
const NetworkTabContent = lazy(() => import('@/features/dashboard/tabs/NetworkTabContent').then((m) => ({ default: m.NetworkTabContent })))
const StorageTabContent = lazy(() => import('@/features/dashboard/tabs/StorageTabContent').then((m) => ({ default: m.StorageTabContent })))

function IamPoliciesTable({ policies }: { policies: IamPolicy[] }) {
  const columns = useMemo<ColumnDef<IamPolicy>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Policy Name',
        cell: (info) => <span style={{ color: 'var(--dash-label)' }}>{String(info.getValue() ?? '')}</span>,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: (info) => (info.getValue() === 'managed' ? 'Managed' : 'Custom'),
      },
      {
        accessorKey: 'attachedAt',
        header: 'Attached At',
        cell: (info) => (
          <span style={{ color: 'var(--dash-text-dim)' }}>
            {formatDate(info.getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as string
          const isActive = status === 'active'
          return (
            <span style={{ color: isActive ? '#7ec87e' : '#e8c07d' }}>
              {isActive ? 'Active' : 'Review needed'}
            </span>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: policies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <table className="fci-table">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const dir = header.column.getIsSorted()
              return (
                <th
                  key={header.id}
                  className="fci-th-sortable"
                  aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
                >
                  <button type="button" className="fci-th-btn" onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <span className={`fci-sort-indicator${dir ? ' fci-sort-active' : ''}`} aria-hidden="true">
                      {dir === 'asc' ? ' ▲' : dir === 'desc' ? ' ▼' : ' ⇅'}
                    </span>
                  </button>
                </th>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── Per-tab content dispatcher ──────────────────────────────────────────────
function TabContent({
  tab,
  service,
  selectedComputeEngineId,
  computeEngineName,
  selectedDatabaseId,
  databaseName,
  maxConnections,
  iamUserWithPolicies,
  selectedBucketId,
  bucketName,
  selectedNetwork,
}: {
  tab: RoutedTab
  service: ServiceId
  selectedComputeEngineId: string | null
  computeEngineName?: string
  selectedDatabaseId?: string | null
  databaseName?: string
  maxConnections?: number
  iamUserWithPolicies?: IamUserWithPolicies | null
  selectedBucketId?: string | null
  bucketName?: string
  selectedNetwork?: Network | null
}) {
  if (service === 'Load Balancer' || service === 'Kubernetes') {
    return <ComingSoonTabContent serviceId={service} />
  }

  return (
    <Suspense fallback={<div className="fci-tab-content"><DashboardLoading /></div>}>
      {service === 'Compute Engine' && (
        <ComputeEngineTabContent tab={tab} selectedComputeEngineId={selectedComputeEngineId} computeEngineName={computeEngineName} />
      )}
      {service === 'Database' && (
        <DatabaseTabContent tab={tab} selectedDatabaseId={selectedDatabaseId ?? null} databaseName={databaseName} maxConnections={maxConnections} />
      )}
      {service === 'IAM' && (
        <IamTabContent tab={tab} iamUserWithPolicies={iamUserWithPolicies} />
      )}
      {service === 'Network' && (
        <NetworkTabContent tab={tab} selectedNetwork={selectedNetwork ?? null} />
      )}
      {service === 'Storage' && (
        <StorageTabContent tab={tab} selectedBucketId={selectedBucketId ?? null} bucketName={bucketName} />
      )}
    </Suspense>
  )
}

interface DetailPanelProps {
  activeService: ServiceId
  activeTab: RoutedTab
  isMobile: boolean
  showDetail: boolean
  setShowDetail: (show: boolean) => void
  setSelectedRowId: (id: string | null) => void
  selectTab: (slug: RoutedTab) => void
  selectedRowId: string | null
  selectedRow: ServiceRow | null
  selectedComputeEngine: ComputeEngine | null
  isComputeEngineRebooting?: boolean
  selectedDatabase: Database | null
  selectedIamUser: IamUser | null
  selectedIamUserWithPolicies: IamUserWithPolicies | null
  selectedBucket: Bucket | null
  selectedNetwork: Network | null
  copyState: CopyState
  copyConnectionString: (text: string) => void
}

export function DetailPanel({
  activeService,
  activeTab,
  isMobile,
  showDetail,
  setShowDetail,
  setSelectedRowId,
  selectTab,
  selectedRowId,
  selectedRow,
  selectedComputeEngine,
  isComputeEngineRebooting = false,
  selectedDatabase,
  selectedIamUser,
  selectedIamUserWithPolicies,
  selectedBucket,
  selectedNetwork,
  copyState,
  copyConnectionString,
}: DetailPanelProps) {
  const dataset = SERVICE_DATASETS[activeService]
  const computeEngineMessage = selectedComputeEngine?.message?.trim()

  return (
    <div className={`fci-detail-panel${isMobile && !showDetail ? ' fci-detail-hidden' : ''}`}>
      {/* Back button: mobile only, returns to list view, standardized icon-only << floating border-notch control */}
      {isMobile && (
        <IconButton
          variant="back"
          placement="notch"
          onClick={() => {
            setShowDetail(false)
            setSelectedRowId(null)
          }}
          title="Back to list"
          ariaLabel="Back to list"
        />
      )}
      <div className="fci-tabs" role="tablist">
        {SERVICE_TABS[activeService].map(({ label, slug }) => (
          <span
            key={label}
            role="tab"
            tabIndex={0}
            aria-selected={slug === activeTab}
            className={slug === activeTab ? 'fci-active' : ''}
            style={{ cursor: 'pointer' }}
            onClick={() => selectTab(slug)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                selectTab(slug)
              }
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {activeService === 'Load Balancer' || activeService === 'Kubernetes' ? (
        <ComingSoonTabContent serviceId={activeService} />
      ) : activeTab === 'info' ? (
        // Info tab ─ always visible regardless of selection: service overview
        // documentation for Compute Engine/Database/IAM/Storage, generic fallback otherwise.
        <>
          {SERVICE_CONTENT[activeService] ? (
            <div className="fci-tab-content">
              <div className="fci-section-title">About {SERVICE_CONTENT[activeService].title}</div>
              {SERVICE_CONTENT[activeService].aboutText.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
              {SERVICE_CONTENT[activeService].architectureNotes && (
                <>
                  <div className="fci-section-title" style={{ marginTop: 12 }}>Architecture Overview</div>
                  <div style={{ color: 'var(--dash-text-dim)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {SERVICE_CONTENT[activeService].architectureNotes}
                  </div>
                </>
              )}
            </div>
          ) : selectedRow ? (
            // Other services: generic fieldLabels mapping (row-dependent)
            <>
              <div className="fci-fieldbox">
                <div className="fci-box-label">{dataset.fieldLabels.summary}</div>
                <div className="fci-box-value">{selectedRow.name}</div>
              </div>
              <div className="fci-fieldrow">
                <div className="fci-fieldbox">
                  <div className="fci-box-label">{dataset.fieldLabels.assignee}</div>
                  <div className="fci-box-value">{selectedRow.col3}</div>
                </div>
                <div className="fci-fieldbox">
                  <div className="fci-box-label">{dataset.fieldLabels.status}</div>
                  <div className="fci-box-value">{selectedRow.status}</div>
                </div>
              </div>
              <div className="fci-fieldrow">
                <div className="fci-fieldbox">
                  <div className="fci-box-label">{dataset.fieldLabels.key}</div>
                  <div className="fci-box-value">{selectedRow.col4}</div>
                </div>
                <div className="fci-fieldbox">
                  <div className="fci-box-label">{dataset.fieldLabels.type}</div>
                  <div className="fci-box-value">{selectedRow.region}</div>
                </div>
              </div>
            </>
          ) : (
            <AnimatedPlaceholder label="NO INSTANCE SELECTED" />
          )}
        </>
      ) : (
          selectedRow ||
          (activeService === 'IAM' && (activeTab === 'permissions' || activeTab === 'policies')) ||
          (activeService === 'Network' && (activeTab === 'network-map' || activeTab === 'firewall' || activeTab === 'routes' || activeTab === 'peering'))
        ) ? (
        <>
          {/* Details tab ─ Compute Engine/Database-specific Instance section + shared Metrics/Network/Security */}
          {activeTab === 'details' && selectedRow && (
            <>
              {activeService === 'Compute Engine' && selectedComputeEngine && (
                <>
                  <div className="fci-fieldbox">
                    <div className="fci-box-label">Name</div>
                    <div className="fci-box-value">{selectedComputeEngine.name}</div>
                  </div>
                  <div className="fci-fieldrow">
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">OS</div>
                      <div className="fci-box-value">{selectedComputeEngine.os}</div>
                    </div>
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Status</div>
                      <div
                        className="fci-box-value"
                        style={{
                          color: resolveStatusColor(dataset, selectedComputeEngine.status),
                        }}
                      >
                        {formatStatusLabel(selectedComputeEngine.status)}
                      </div>
                      {selectedComputeEngine.status === 'pending' && !isComputeEngineRebooting && computeEngineMessage && (
                        <output
                          aria-label="Provisioning warning"
                          style={{ color: '#e8c07d', fontSize: '0.78rem', lineHeight: 1.4, marginTop: 4 }}
                        >
                          ⚠ {computeEngineMessage}
                        </output>
                      )}
                    </div>
                  </div>
                  <div className="fci-fieldrow">
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">IP Address</div>
                      <div className="fci-box-value">{selectedComputeEngine.ipAddress}</div>
                    </div>
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Region</div>
                      <div className="fci-box-value">{selectedComputeEngine.region}</div>
                    </div>
                  </div>
                  <div className="fci-section-title">Instance</div>
                  <div className="fci-metricrow">
                    <div>CPU: <span style={{ color: 'var(--dash-label)' }}>{selectedComputeEngine.cpu} vCPU</span></div>
                    <div>Memory: <span style={{ color: 'var(--dash-label)' }}>{selectedComputeEngine.memory} GB</span></div>
                    <div>Disk: <span style={{ color: 'var(--dash-label)' }}>{selectedComputeEngine.disk} GB</span></div>
                    <div>Disk Type: <span style={{ color: 'var(--dash-label)' }}>{selectedComputeEngine.diskType}</span></div>
                    <div>Created: <span style={{ color: 'var(--dash-text-dim)' }}>{formatDate(selectedComputeEngine.createdAt)}</span></div>
                  </div>
                </>
              )}
              {activeService === 'Database' && selectedDatabase && (
                <>
                  <div className="fci-fieldbox">
                    <div className="fci-box-label">Name</div>
                    <div className="fci-box-value">{selectedDatabase.name}</div>
                  </div>
                  <div className="fci-fieldrow">
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Engine</div>
                      <div className="fci-box-value">{selectedDatabase.engine} {selectedDatabase.version}</div>
                    </div>
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Status</div>
                      <div
                        className="fci-box-value"
                        style={{
                          color: resolveStatusColor(dataset, selectedDatabase.status),
                        }}
                      >
                        {formatStatusLabel(selectedDatabase.status)}
                      </div>
                    </div>
                  </div>
                  <div className="fci-fieldrow">
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Endpoint</div>
                      <div className="fci-box-value">{selectedDatabase.host}:{selectedDatabase.port}</div>
                    </div>
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Region</div>
                      <div className="fci-box-value">{selectedDatabase.region}</div>
                    </div>
                  </div>
                  <div className="fci-fieldbox">
                    <div className="fci-box-label">Connection String</div>
                    <div className="fci-box-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedDatabase.connectionString}
                      </span>
                      <button
                        type="button"
                        className="fci-linkbtn"
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.45rem',
                          background: 'transparent',
                          border: '1px solid var(--dash-label)',
                          color: copyState === 'failed' ? '#e0546a' : 'var(--dash-label)',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                        onClick={() => copyConnectionString(selectedDatabase.connectionString)}
                      >
                        {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Failed' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="fci-section-title">Instance</div>
                  <div className="fci-metricrow">
                    <div>CPU: <span style={{ color: 'var(--dash-label)' }}>{selectedDatabase.cpu} vCPU</span></div>
                    <div>Memory: <span style={{ color: 'var(--dash-label)' }}>{selectedDatabase.memory} GB</span></div>
                    <div>Storage Size: <span style={{ color: 'var(--dash-label)' }}>{selectedDatabase.storageSize} GB</span></div>
                    <div>Max Connections: <span style={{ color: 'var(--dash-label)' }}>{selectedDatabase.maxConnections}</span></div>
                    <div>Active Connections: <span style={{ color: 'var(--dash-label)' }}>{selectedDatabase.activeConnections}</span></div>
                    <div>
                      Backup Status:{' '}
                      <span
                        style={{
                          color:
                            selectedDatabase.backupStatus === 'healthy' ? '#7ec87e'
                            : selectedDatabase.backupStatus === 'failed' ? '#e0546a'
                            : selectedDatabase.backupStatus === 'in-progress' ? '#e8c07d'
                            : '#8a97a5',
                        }}
                      >
                        {selectedDatabase.backupStatus}
                      </span>
                    </div>
                    <div>Created: <span style={{ color: 'var(--dash-text-dim)' }}>{formatDate(selectedDatabase.createdAt)}</span></div>
                  </div>
                </>
              )}
              {activeService === 'IAM' && selectedIamUserWithPolicies && selectedIamUser && (
                <>
                  <div className="fci-fieldbox">
                    <div className="fci-box-label">Name</div>
                    <div className="fci-box-value">{selectedIamUser.name}</div>
                  </div>
                  <div className="fci-fieldrow">
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Email</div>
                      <div className="fci-box-value">{selectedIamUser.email}</div>
                    </div>
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Status</div>
                      <div
                        className="fci-box-value"
                        style={{
                          color: resolveStatusColor(dataset, selectedIamUser.status),
                        }}
                      >
                        {formatStatusLabel(selectedIamUser.status)}
                      </div>
                    </div>
                  </div>
                  <div className="fci-fieldrow">
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Last Login</div>
                      <div className="fci-box-value">
                        {new Date(selectedIamUser.lastLogin).toLocaleString()}
                      </div>
                    </div>
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">MFA Status</div>
                      <div
                        className="fci-box-value"
                        style={{ color: selectedIamUser.mfaEnabled ? '#7ec87e' : '#e8c07d' }}
                      >
                        {selectedIamUser.mfaEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                  <div className="fci-fieldbox">
                    <div className="fci-box-label">Region</div>
                    <div className="fci-box-value">{selectedIamUser.region}</div>
                  </div>
                  <div className="fci-section-title">Account</div>
                  <div className="fci-metricrow">
                    <div>Created: <span style={{ color: 'var(--dash-text-dim)' }}>{formatDate(selectedIamUserWithPolicies.createdAt)}</span></div>
                    <div>Role: <span style={{ color: 'var(--dash-label)' }}>{selectedIamUserWithPolicies.role}</span></div>
                    <div>MFA: <span style={{ color: selectedIamUserWithPolicies.mfaEnabled ? '#7ec87e' : '#e8c07d' }}>{selectedIamUserWithPolicies.mfaEnabled ? 'Enabled' : 'Disabled'}</span></div>
                  </div>
                  <div className="fci-section-title">Policies</div>
                  {selectedIamUserWithPolicies.policies.length > 0 ? (
                    <IamPoliciesTable policies={selectedIamUserWithPolicies.policies} />
                  ) : (
                    <div style={{ color: 'var(--dash-text-dim)', fontSize: '0.85rem', padding: '0.5rem 0' }}>No policies attached.</div>
                  )}
                </>
              )}
              {activeService === 'Storage' && selectedBucket && (
                <>
                  <div className="fci-fieldbox">
                    <div className="fci-box-label">Bucket Name</div>
                    <div className="fci-box-value">{selectedBucket.bucketName}</div>
                  </div>
                  <div className="fci-fieldrow">
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Access Level</div>
                      <div className="fci-box-value">
                        {selectedBucket.access.charAt(0).toUpperCase() + selectedBucket.access.slice(1)}
                      </div>
                    </div>
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Status</div>
                      <div
                        className="fci-box-value"
                        style={{
                          color: resolveStatusColor(dataset, selectedBucket.status),
                        }}
                      >
                        {formatStatusLabel(selectedBucket.status)}
                      </div>
                    </div>
                  </div>
                  <div className="fci-fieldrow">
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Region</div>
                      <div className="fci-box-value">{selectedBucket.region}</div>
                    </div>
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Total Size</div>
                      <div className="fci-box-value">{formatBytes(selectedBucket.totalSize)}</div>
                    </div>
                  </div>
                  <div className="fci-fieldbox">
                    <div className="fci-box-label">Object Count</div>
                    <div className="fci-box-value">{selectedBucket.objectCount}</div>
                  </div>
                  <div className="fci-section-title">Bucket</div>
                  <div className="fci-metricrow">
                    <div>Created: <span style={{ color: 'var(--dash-text-dim)' }}>{formatDate(selectedBucket.createdAt)}</span></div>
                    <div>
                      Versioning:{' '}
                      <span style={{ color: selectedBucket.versioning ? '#7ec87e' : '#e8c07d' }}>
                        {selectedBucket.versioning ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div>
                      Lifecycle:{' '}
                      <span style={{ color: selectedBucket.lifecycleEnabled ? '#7ec87e' : '#e8c07d' }}>
                        {selectedBucket.lifecycleEnabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </>
              )}
              {activeService === 'Network' && selectedNetwork && (
                <>
                  <div className="fci-fieldbox">
                    <div className="fci-box-label">VPC Name</div>
                    <div className="fci-box-value">{selectedNetwork.vpcName}</div>
                  </div>
                  <div className="fci-fieldrow">
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Type</div>
                      <div className="fci-box-value">{selectedNetwork.type}</div>
                    </div>
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Status</div>
                      <div
                        className="fci-box-value"
                        style={{
                          color: resolveStatusColor(dataset, selectedNetwork.status),
                        }}
                      >
                        {formatStatusLabel(selectedNetwork.status)}
                      </div>
                    </div>
                  </div>
                  <div className="fci-fieldrow">
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">CIDR Block</div>
                      <div className="fci-box-value">{selectedNetwork.cidrBlock}</div>
                    </div>
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Gateway</div>
                      <div className="fci-box-value">{selectedNetwork.gateway}</div>
                    </div>
                    <div className="fci-fieldbox">
                      <div className="fci-box-label">Region</div>
                      <div className="fci-box-value">{selectedNetwork.region}</div>
                    </div>
                  </div>
                  <div className="fci-section-title">Summary</div>
                  <div className="fci-metricrow">
                    <div>Created: <span style={{ color: 'var(--dash-text-dim)' }}>{formatDate(selectedNetwork.createdAt)}</span></div>
                    <div>Firewall Rules: <span style={{ color: 'var(--dash-label)' }}>{selectedNetwork.firewallRules.length}</span></div>
                    <div>Routes: <span style={{ color: 'var(--dash-label)' }}>{selectedNetwork.routes.length}</span></div>
                    <div>Peering Connections: <span style={{ color: 'var(--dash-label)' }}>{selectedNetwork.peerings.length}</span></div>
                  </div>
                </>
              )}
              {activeService !== 'IAM' && activeService !== 'Storage' && activeService !== 'Network' && (
                <>
                  <div className="fci-section-title">Metrics</div>
                  <div className="fci-metricrow">
                    <div>CPU: <span style={{ color: '#7ec87e' }}>32%</span></div>
                    <div>Memory: <span style={{ color: '#e8c07d' }}>58%</span></div>
                    <div>Disk I/O: <span style={{ color: 'var(--dash-label)' }}>14 MB/s</span></div>
                    <div>Uptime: <span style={{ color: 'var(--dash-text)' }}>99.98%</span></div>
                  </div>
                  <div className="fci-section-title">Network</div>
                  <div className="fci-metricrow">
                    <div>Ingress: <span style={{ color: 'var(--dash-label)' }}>142 Mbps</span></div>
                    <div>Egress: <span style={{ color: 'var(--dash-label)' }}>89 Mbps</span></div>
                    <div>Latency: <span style={{ color: '#7ec87e' }}>12ms</span></div>
                    <div>Packet loss: <span style={{ color: '#7ec87e' }}>0.01%</span></div>
                  </div>
                  <div className="fci-section-title">Security</div>
                  <div className="fci-metricrow">
                    <div>Open alerts: <span style={{ color: '#e0546a' }}>2</span></div>
                    <div>Failed logins: <span style={{ color: '#e8c07d' }}>7</span></div>
                    <div>Patch status: <span style={{ color: '#7ec87e' }}>up to date</span></div>
                    <div>Firewall: <span style={{ color: '#7ec87e' }}>active</span></div>
                  </div>
                </>
              )}
            </>
          )}

          {/* All other tabs */}
          {activeTab !== 'details' && (
            <TabContent
              tab={activeTab}
              service={activeService}
              selectedComputeEngineId={activeService === 'Compute Engine' ? selectedRowId : null}
              computeEngineName={activeService === 'Compute Engine' ? (selectedComputeEngine?.name ?? selectedRow?.name) : undefined}
              selectedDatabaseId={activeService === 'Database' ? selectedRowId : null}
              databaseName={activeService === 'Database' ? (selectedDatabase?.name ?? selectedRow?.name) : undefined}
              maxConnections={activeService === 'Database' ? selectedDatabase?.maxConnections : undefined}
              iamUserWithPolicies={activeService === 'IAM' ? selectedIamUserWithPolicies : undefined}
              selectedBucketId={activeService === 'Storage' ? selectedRowId : null}
              bucketName={activeService === 'Storage' ? (selectedBucket?.bucketName ?? selectedRow?.name) : undefined}
              selectedNetwork={activeService === 'Network' ? selectedNetwork : undefined}
            />
          )}
        </>
      ) : (
        <AnimatedPlaceholder label="NO INSTANCE SELECTED" />
      )}
    </div>
  )
}
