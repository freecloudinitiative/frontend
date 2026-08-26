import type { ServiceId } from '@/features/dashboard/serviceCatalog'

export const ROUTED_TABS = [
  'info', 'details', 'create', 'settings',
  // Compute Engine
  'console', 'storage', 'network', 'backups', 'metrics',
  // Database
  'connections', 'logs', 'sql-editor', 'data-import',
  // IAM
  'permissions', 'policies', 'activity',
  // Network
  'network-map', 'firewall', 'routes', 'peering',
  // Storage
  'objects', 'access',
] as const
export type RoutedTab = (typeof ROUTED_TABS)[number]

export type Tab = { label: string; slug: RoutedTab }

export const COMMON_TABS: Tab[] = [
  { label: 'Info', slug: 'info' },
  { label: 'Details', slug: 'details' },
]

export const SERVICE_TABS: Record<ServiceId, Tab[]> = {
  'Compute Engine': [...COMMON_TABS, { label: 'Console', slug: 'console' }, { label: 'Storage', slug: 'storage' }, { label: 'Network', slug: 'network' }, { label: 'Backups', slug: 'backups' }, { label: 'Metrics', slug: 'metrics' }],
  Database:        [...COMMON_TABS, { label: 'Connections', slug: 'connections' }, { label: 'Backups', slug: 'backups' }, { label: 'Logs', slug: 'logs' }, { label: 'Metrics', slug: 'metrics' }, { label: 'SQL Editor', slug: 'sql-editor' }, { label: 'Data Import', slug: 'data-import' }],
  IAM:             [...COMMON_TABS, { label: 'Permissions', slug: 'permissions' }, { label: 'Policies', slug: 'policies' }, { label: 'Activity', slug: 'activity' }],
  Network:         [...COMMON_TABS, { label: 'Network Map', slug: 'network-map' }, { label: 'Firewall', slug: 'firewall' }, { label: 'Routes', slug: 'routes' }, { label: 'Peering', slug: 'peering' }],
  Storage:         [...COMMON_TABS, { label: 'Objects', slug: 'objects' }, { label: 'Access', slug: 'access' }, { label: 'Metrics', slug: 'metrics' }],
  'Load Balancer': [...COMMON_TABS],
  Kubernetes:      [...COMMON_TABS],
  Elasticsearch:   [...COMMON_TABS],
  Kafka:           [...COMMON_TABS],
}

export type MenuItem = { label: string; danger?: boolean }

export const SERVICE_MENUS: Record<ServiceId, MenuItem[]> = {
  'Compute Engine': [{ label: 'Launch Compute Engine' }, { label: 'Stop' }, { label: 'Reboot' }, { label: 'Delete', danger: true }],
  Database:        [{ label: 'Connect' }, { label: 'Take backup' }, { label: 'Restore' }, { label: 'Delete', danger: true }],
  IAM:             [{ label: 'Add user' }, { label: 'Edit role' }, { label: 'Revoke access', danger: true }],
  Network:         [{ label: 'Add subnet' }, { label: 'Edit firewall' }, { label: 'Create VPN' }, { label: 'Delete', danger: true }],
  Storage:         [{ label: 'Create bucket' }, { label: 'Upload' }, { label: 'Set policy' }, { label: 'Delete', danger: true }],
  'Load Balancer': [{ label: 'Create Load Balancer' }],
  Kubernetes:      [{ label: 'Create Cluster' }],
  Elasticsearch:   [{ label: 'Create Cluster' }, { label: 'Create Index' }, { label: 'Reindex' }, { label: 'Delete', danger: true }],
  Kafka:           [{ label: 'Create Cluster' }, { label: 'Create Topic' }, { label: 'Rebalance' }, { label: 'Delete', danger: true }],
}

// ── Modal action types ───────────────────────────────────────────────────────
export type ModalAction =
  | 'stop' | 'reboot' | 'delete'
  | 'db-connect' | 'db-backup' | 'db-restore' | 'db-delete'
  | 'iam-edit-role' | 'iam-revoke' | 'iam-delete'
  | 'storage-delete' | 'storage-upload' | 'storage-policy'
  | 'network-delete' | 'network-vpn'
  | null

// ── Search helper ────────────────────────────────────────────────────────────
export type SearchResult =
  | { kind: 'tab'; label: string; slug: RoutedTab }
  | { kind: 'action'; label: string; danger?: boolean }

export function getSearchResults(serviceId: ServiceId, query: string): SearchResult[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const tabs: SearchResult[] = SERVICE_TABS[serviceId]
    .filter((t) => t.label.toLowerCase().includes(q))
    .map((t) => ({ kind: 'tab', label: t.label, slug: t.slug }))
  const actions: SearchResult[] = SERVICE_MENUS[serviceId]
    .filter((a) => a.label.toLowerCase().includes(q))
    .map((a) => ({ kind: 'action', label: a.label, danger: a.danger }))
  return [...tabs, ...actions]
}
