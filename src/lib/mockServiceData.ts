export type ServiceId = 'VM' | 'Database' | 'IAM' | 'Network' | 'Storage'

export interface ServiceRow {
  id: string
  name: string
  status: string
  col3: string
  col4: string
  col5: string
  col6: string
  region: string
}

export interface ServiceDataset {
  headers: string[]
  fieldLabels: { summary: string; assignee: string; status: string; key: string; type: string }
  rows: ServiceRow[]
  statusColors: Record<string, string>
  col3Colors: Record<string, string>
  col5Colors?: Record<string, string>
}

export const SERVICES: { id: ServiceId; hotkey: string }[] = [
  { id: 'VM', hotkey: 'v' },
  { id: 'Database', hotkey: 'd' },
  { id: 'IAM', hotkey: 'i' },
  { id: 'Network', hotkey: 'n' },
  { id: 'Storage', hotkey: 's' },
]

export function serviceIdToSlug(id: ServiceId): string {
  return id.toLowerCase()
}

export function slugToServiceId(slug: string | undefined): ServiceId | undefined {
  return SERVICES.find((service) => serviceIdToSlug(service.id) === slug)?.id
}

export const SERVICE_DATASETS: Record<ServiceId, ServiceDataset> = {
  VM: {
    headers: ['#', 'Name', 'Region', 'Status', 'OS', 'IP', 'Mem', 'CPU'],
    fieldLabels: { summary: 'Name', assignee: 'OS', status: 'Status', key: 'IP', type: 'Region' },
    rows: [],
    statusColors: { Running: '#7ec87e', Stopped: '#e0546a', Pending: '#e8c07d', Rebooting: '#e8c07d' },
    col3Colors: {},
  },
  Database: {
    headers: ['#', 'Name', 'Region', 'Status', 'Engine', 'Endpoint', 'Mem', 'Storage'],
    fieldLabels: { summary: 'Name', assignee: 'Engine', status: 'Status', key: 'Endpoint', type: 'Region' },
    rows: [],
    statusColors: { Running: '#7ec87e', Stopped: '#e0546a', Pending: '#e8c07d' },
    col3Colors: {},
  },
  Storage: {
    headers: ['#', 'Name', 'Region', 'Status', 'Access', 'Size', 'Objects'],
    fieldLabels: { summary: 'Name', assignee: 'Access', status: 'Status', key: 'Size', type: 'Region' },
    rows: [],
    statusColors: { Active: '#7ec87e', Attached: '#7ec87e', Archived: '#8a97a5', Detached: '#e0546a' },
    col3Colors: { Private: 'var(--dash-text-dim)', 'Public-read': '#e8c07d', 'Public-read-write': '#e0546a' },
  },
  Network: {
    headers: ['#', 'Name', 'Region', 'Status', 'Type', 'CIDR', 'Gateway'],
    fieldLabels: { summary: 'Name', assignee: 'Type', status: 'Status', key: 'CIDR', type: 'Gateway' },
    rows: [],
    statusColors: { Active: '#7ec87e', Down: '#e0546a', Pending: '#e8c07d' },
    col3Colors: {},
  },
  IAM: {
    headers: ['#', 'User', 'Region', 'Status', 'Role', 'Last login', 'MFA'],
    fieldLabels: { summary: 'User', assignee: 'Role', status: 'Status', key: 'Last login', type: 'Region' },
    rows: [],
    statusColors: { Active: '#7ec87e', Disabled: '#e0546a' },
    col3Colors: {},
    col5Colors: {},
  },
}
