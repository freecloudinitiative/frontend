import { useMemo } from 'react'
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
} from '@/lib/mockServiceData'
import { formatBytes } from '@/features/storage/format'
import type { ComputeEngine } from '@/features/computeEngine/types'
import type { Database } from '@/features/database/types'
import type { IamUser, IamUserWithPolicies, IamPolicy } from '@/features/iam/types'
import type { Bucket } from '@/features/storage/types'
import type { Network } from '@/features/network/types'
import { SERVICE_TABS, type RoutedTab } from '@/features/dashboard/constants'
import {
  ComputeEngineTabContent,
  DatabaseTabContent,
  IamTabContent,
  NetworkTabContent,
  StorageTabContent,
  ComingSoonTabContent,
} from '@/features/dashboard/tabs'
import type { CopyState } from '@/features/database/store'

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
            {new Date(info.getValue() as string).toLocaleDateString()}
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
  switch (service) {
    case 'Compute Engine': return <ComputeEngineTabContent tab={tab} selectedComputeEngineId={selectedComputeEngineId} computeEngineName={computeEngineName} />
    case 'Database':      return <DatabaseTabContent tab={tab} selectedDatabaseId={selectedDatabaseId ?? null} databaseName={databaseName} maxConnections={maxConnections} />
    case 'IAM':           return <IamTabContent tab={tab} iamUserWithPolicies={iamUserWithPolicies} />
    case 'Network':       return <NetworkTabContent tab={tab} selectedNetwork={selectedNetwork ?? null} />
    case 'Storage':       return <StorageTabContent tab={tab} selectedBucketId={selectedBucketId ?? null} bucketName={bucketName} />
    case 'Load Balancer':
    case 'Kubernetes':    return <ComingSoonTabContent serviceId={service} />
    default:              return null
  }
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
  selectedDatabase,
  selectedIamUser,
  selectedIamUserWithPolicies,
  selectedBucket,
  selectedNetwork,
  copyState,
  copyConnectionString,
}: DetailPanelProps) {
  const dataset = SERVICE_DATASETS[activeService]

  return (
    <div className={`fci-detail-panel${isMobile && !showDetail ? ' fci-detail-hidden' : ''}`}>
      {/* Back button: mobile only, returns to list view, standardized icon-only << floating border-notch control */}
      {isMobile && (
        <button
          type="button"
          className="fci-linkbtn fci-action-back fci-box-key-top"
          onClick={() => {
            setShowDetail(false)
            setSelectedRowId(null)
          }}
          aria-label="Back to list"
          title="Back to list"
        >
          &lt;&lt;
        </button>
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

      {activeTab === 'info' ? (
        // Info tab ─ always visible regardless of selection: service overview
        // documentation for Compute Engine/Database/IAM/Storage, generic fallback otherwise.
        <>
          {activeService === 'Compute Engine' ? (
            <div className="fci-tab-content">
              <div className="fci-section-title">About Compute Engine Service</div>
              <p>Provision and manage virtual machine instances across regions. Each Compute Engine is a dedicated compute resource with configurable CPU, memory, and disk.</p>
              <p>Use the Details tab for instance specs and identity, Console for an interactive terminal, Storage/Network for attached resources, and Metrics for live CPU/memory/disk graphs.</p>
            </div>
          ) : activeService === 'Database' ? (
            <div className="fci-tab-content">
              <div className="fci-section-title">About Database Service</div>
              <p>Managed relational and key-value database instances (PostgreSQL, MySQL, Redis) with automated backups and connection pooling.</p>
              <p>Use the Details tab for instance specs and connection info, SQL Editor to run queries, Data Import to load CSV/JSON/SQL files, and Metrics for live performance graphs.</p>
            </div>
          ) : activeService === 'IAM' ? (
            <div className="fci-tab-content">
              <div className="fci-section-title">About IAM Service</div>
              <p>Identity and Access Management for project users. Assign roles, review attached policies, and audit login/MFA status.</p>
              <p>Use the Details tab for account identity and attached policies, Permissions to see effective allow/deny rules, and Activity for a recent audit log.</p>
            </div>
          ) : activeService === 'Storage' ? (
            <div className="fci-tab-content">
              <div className="fci-section-title">About Storage Service</div>
              <p>Object storage buckets for files and backups, with configurable access level, versioning, and lifecycle rules.</p>
              <p>Use the Details tab for bucket identity and configuration, Objects to browse files, Access for IAM bindings, and Metrics for live size/throughput graphs.</p>
            </div>
          ) : activeService === 'Network' ? (
            <div className="fci-tab-content">
              <div className="fci-section-title">About Network Service</div>
              <p>Virtual private networks (VPCs, subnets, and public networks) with configurable CIDR ranges, firewall rules, routing, and VPC peering.</p>
              <p>Use the Details tab for network identity and configuration, Firewall to manage ingress/egress rules, Routes for the route table, and Peering for VPC-to-VPC connections.</p>
            </div>
          ) : activeService === 'Load Balancer' || activeService === 'Kubernetes' ? (
            <ComingSoonTabContent serviceId={activeService} />
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
            <div className="fci-tab-content" style={{ color: 'var(--dash-text-dim)' }}>
              Select a row to view info.
            </div>
          )}
        </>
      ) : (
          selectedRow ||
          (activeService === 'IAM' && (activeTab === 'permissions' || activeTab === 'policies')) ||
          (activeService === 'Network' && (activeTab === 'firewall' || activeTab === 'routes' || activeTab === 'peering'))
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
                          color:
                            dataset.statusColors[
                              selectedComputeEngine.status.charAt(0).toUpperCase() + selectedComputeEngine.status.slice(1)
                            ] ?? 'var(--dash-text)',
                        }}
                      >
                        {selectedComputeEngine.status.charAt(0).toUpperCase() + selectedComputeEngine.status.slice(1)}
                      </div>
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
                    <div>Created: <span style={{ color: 'var(--dash-text-dim)' }}>{new Date(selectedComputeEngine.createdAt).toLocaleDateString()}</span></div>
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
                          color:
                            dataset.statusColors[
                              selectedDatabase.status.charAt(0).toUpperCase() + selectedDatabase.status.slice(1)
                            ] ?? 'var(--dash-text)',
                        }}
                      >
                        {selectedDatabase.status.charAt(0).toUpperCase() + selectedDatabase.status.slice(1)}
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
                    <div>Created: <span style={{ color: 'var(--dash-text-dim)' }}>{new Date(selectedDatabase.createdAt).toLocaleDateString()}</span></div>
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
                          color:
                            dataset.statusColors[
                              selectedIamUser.status.charAt(0).toUpperCase() + selectedIamUser.status.slice(1)
                            ] ?? 'var(--dash-text)',
                        }}
                      >
                        {selectedIamUser.status.charAt(0).toUpperCase() + selectedIamUser.status.slice(1)}
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
                    <div>Created: <span style={{ color: 'var(--dash-text-dim)' }}>{new Date(selectedIamUserWithPolicies.createdAt).toLocaleDateString()}</span></div>
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
                          color:
                            dataset.statusColors[
                              selectedBucket.status.charAt(0).toUpperCase() + selectedBucket.status.slice(1)
                            ] ?? 'var(--dash-text)',
                        }}
                      >
                        {selectedBucket.status.charAt(0).toUpperCase() + selectedBucket.status.slice(1)}
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
                    <div>Created: <span style={{ color: 'var(--dash-text-dim)' }}>{new Date(selectedBucket.createdAt).toLocaleDateString()}</span></div>
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
                          color:
                            dataset.statusColors[
                              selectedNetwork.status.charAt(0).toUpperCase() + selectedNetwork.status.slice(1)
                            ] ?? 'var(--dash-text)',
                        }}
                      >
                        {selectedNetwork.status.charAt(0).toUpperCase() + selectedNetwork.status.slice(1)}
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
                    <div>Created: <span style={{ color: 'var(--dash-text-dim)' }}>{new Date(selectedNetwork.createdAt).toLocaleDateString()}</span></div>
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: '0.75rem',
            color: 'var(--dash-text-dim)',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🚀</span>
          <span style={{ fontSize: '1rem', letterSpacing: '0.08em', fontWeight: 600 }}>
            Coming Soon
          </span>
          <span style={{ fontSize: '0.78rem', opacity: 0.6 }}>
            This service has no resources yet. Check back later.
          </span>
        </div>
      )}
    </div>
  )
}
