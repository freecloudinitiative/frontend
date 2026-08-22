// Dashboard presentation config, not fixtures. Row data comes from the API.

export type ServiceId = 'Compute Engine' | 'Database' | 'IAM' | 'Network' | 'Storage' | 'Load Balancer' | 'Kubernetes'

export interface ServiceRow {
  id: string
  name: string
  status: string
  col3: string
  col4: string
  col5: string
  col6: string
  region: string
  zone: string
}

export interface ServiceDataset {
  headers: string[]
  fieldLabels: { summary: string; assignee: string; status: string; key: string; type: string }
  statusColors: Record<string, string>
  col3Colors: Record<string, string>
  col5Colors?: Record<string, string>
}

export const SERVICES: { id: ServiceId; hotkey: string; shortcode: string }[] = [
  { id: 'Compute Engine', hotkey: 'c', shortcode: 'ce'  },
  { id: 'Database',      hotkey: 'd', shortcode: 'db'  },
  { id: 'IAM',           hotkey: 'i', shortcode: 'iam' },
  { id: 'Network',       hotkey: 'n', shortcode: 'net' },
  { id: 'Storage',       hotkey: 's', shortcode: 'str' },
  { id: 'Load Balancer', hotkey: 'l', shortcode: 'lb'  },
  { id: 'Kubernetes',    hotkey: 'k', shortcode: 'k8s' },
]

export function serviceIdToSlug(id: ServiceId): string {
  if (id === 'Load Balancer') return 'load-balancer'
  if (id === 'Compute Engine') return 'compute-engine'
  return id.toLowerCase()
}

export function slugToServiceId(slug: string | undefined): ServiceId | undefined {
  return SERVICES.find((service) => serviceIdToSlug(service.id) === slug)?.id
}

export const SERVICE_DATASETS: Record<ServiceId, ServiceDataset> = {
  'Compute Engine': {
    headers: ['#', 'Name', 'Zone', 'Status', 'OS', 'IP', 'Mem', 'CPU'],
    fieldLabels: { summary: 'Name', assignee: 'OS', status: 'Status', key: 'IP', type: 'Region' },
    statusColors: { Running: '#7ec87e', Stopped: '#e0546a', Pending: '#e8c07d', Rebooting: '#e8c07d' },
    col3Colors: {},
  },
  Database: {
    headers: ['#', 'Name', 'Zone', 'Status', 'Engine', 'Endpoint', 'Mem', 'Storage'],
    fieldLabels: { summary: 'Name', assignee: 'Engine', status: 'Status', key: 'Endpoint', type: 'Region' },
    statusColors: { Running: '#7ec87e', Stopped: '#e0546a', Pending: '#e8c07d' },
    col3Colors: {},
  },
  Storage: {
    headers: ['#', 'Name', 'Zone', 'Status', 'Access', 'Size', 'Objects'],
    fieldLabels: { summary: 'Name', assignee: 'Access', status: 'Status', key: 'Size', type: 'Region' },
    statusColors: { Active: '#7ec87e', Attached: '#7ec87e', Archived: '#8a97a5', Detached: '#e0546a' },
    col3Colors: { Private: 'var(--dash-text-dim)', 'Public-read': '#e8c07d', 'Public-read-write': '#e0546a' },
  },
  Network: {
    headers: ['#', 'Name', 'Zone', 'Status', 'Type', 'CIDR', 'Gateway'],
    fieldLabels: { summary: 'Name', assignee: 'Type', status: 'Status', key: 'CIDR', type: 'Gateway' },
    statusColors: { Active: '#7ec87e', Down: '#e0546a', Pending: '#e8c07d' },
    col3Colors: {},
  },
  IAM: {
    headers: ['#', 'User', 'Zone', 'Status', 'Role', 'Last login', 'MFA'],
    fieldLabels: { summary: 'User', assignee: 'Role', status: 'Status', key: 'Last login', type: 'Region' },
    statusColors: { Active: '#7ec87e', Disabled: '#e0546a' },
    col3Colors: {},
    col5Colors: {},
  },
  'Load Balancer': {
    headers: ['#', 'Name', 'Zone', 'Status', 'Algorithm', 'Target Group', 'Port'],
    fieldLabels: { summary: 'Name', assignee: 'Algorithm', status: 'Status', key: 'Target Group', type: 'Region' },
    statusColors: { Active: '#7ec87e', Inactive: '#e0546a' },
    col3Colors: {},
  },
  Kubernetes: {
    headers: ['#', 'Name', 'Zone', 'Status', 'Version', 'Nodes', 'Cluster CIDR'],
    fieldLabels: { summary: 'Name', assignee: 'Version', status: 'Status', key: 'Nodes', type: 'Region' },
    statusColors: { Active: '#7ec87e', Updating: '#e8c07d', Stopped: '#e0546a' },
    col3Colors: {},
  },
}
