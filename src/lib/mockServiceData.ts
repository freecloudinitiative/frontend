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

function toRows(raw: [string, string, string, string, string, string, string, string][]): ServiceRow[] {
  return raw.map(([id, name, status, col3, col4, region, col5, col6]) => ({
    id, name, status, col3, col4, region, col5, col6,
  }))
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
    headers: ['#', 'Name', 'Status', 'OS', 'IP', 'Mem', 'CPU'],
    fieldLabels: { summary: 'Name', assignee: 'OS', status: 'Status', key: 'IP', type: 'Region' },
    rows: toRows([
      ['1', 'web-prod-01',    'Running', 'Ubuntu 22.04', '10.0.1.11', 'eu-west-1',    '8 GB',   '4 vCPU'],
      ['2', 'web-prod-02',    'Running', 'Ubuntu 22.04', '10.0.1.12', 'eu-west-1',    '8 GB',   '4 vCPU'],
      ['3', 'api-prod-01',    'Running', 'Ubuntu 20.04', '10.0.1.20', 'eu-west-1',    '16 GB',  '8 vCPU'],
      ['4', 'db-primary',     'Running', 'Fedora 39',    '10.0.2.10', 'eu-west-1',    '64 GB',  '16 vCPU'],
      ['5', 'db-replica-01',  'Running', 'Fedora 39',    '10.0.2.11', 'eu-central-1', '64 GB',  '16 vCPU'],
      ['6', 'cache-redis-01', 'Running', 'Ubuntu 22.04', '10.0.3.5',  'eu-west-1',    '4 GB',   '2 vCPU'],
      ['7', 'worker-01',      'Stopped', 'Ubuntu 22.04', '10.0.4.2',  'eu-west-1',    '4 GB',   '2 vCPU'],
      ['8', 'monitoring-01',  'Running', 'Fedora 38',    '10.0.5.1',  'eu-central-1', '8 GB',   '4 vCPU'],
      ['9', 'staging-web-01', 'Running', 'Ubuntu 24.04', '10.0.6.7',  'eu-west-1',    '4 GB',   '2 vCPU'],
    ]),
    statusColors: { Running: '#7ec87e', Stopped: '#e0546a', Rebooting: '#e8c07d' },
    col3Colors: {
      'Ubuntu 22.04': '#e07d2e',
      'Ubuntu 20.04': '#e07d2e',
      'Ubuntu 24.04': '#e07d2e',
      'Fedora 39': '#4fa8dc',
      'Fedora 38': '#4fa8dc',
    },
  },
  Database: {
    headers: ['#', 'Name', 'Status', 'Engine', 'Endpoint', 'Mem', 'Storage'],
    fieldLabels: { summary: 'Name', assignee: 'Engine', status: 'Status', key: 'Endpoint', type: 'Region' },
    rows: toRows([
      ['1', 'payments-db',   'Running', 'PostgreSQL 15', 'db1.internal', 'eu-west-1',    '32 GB', '500 GB'],
      ['2', 'users-db',      'Running', 'PostgreSQL 15', 'db2.internal', 'eu-west-1',    '16 GB', '200 GB'],
      ['3', 'analytics-db',  'Running', 'MySQL 8.0',     'db3.internal', 'eu-central-1', '64 GB', '1 TB'],
      ['4', 'cache-cluster', 'Running', 'Redis 7',       'db4.internal', 'eu-west-1',    '16 GB', '16 GB'],
      ['5', 'legacy-db',     'Stopped', 'MySQL 5.7',     'db5.internal', 'eu-west-1',    '8 GB',  '100 GB'],
    ]),
    statusColors: { Running: '#7ec87e', Stopped: '#e0546a', Rebooting: '#e8c07d' },
    col3Colors: {
      'PostgreSQL 15': '#4fa8dc',
      'MySQL 8.0': '#e07d2e',
      'MySQL 5.7': '#e07d2e',
      'Redis 7': '#e0546a',
    },
  },
  Storage: {
    headers: ['#', 'Name', 'Status', 'Type', 'Size', 'Region', 'Access'],
    fieldLabels: { summary: 'Name', assignee: 'Type', status: 'Status', key: 'Size', type: 'Region' },
    rows: toRows([
      ['1', 'assets-bucket',       'Active',   'Object',   '128 GB', 'eu-west-1',    'eu-west-1',    'Public'],
      ['2', 'backups-bucket',      'Active',   'Object',   '2.4 TB', 'eu-west-1',    'eu-west-1',    'Private'],
      ['3', 'db-primary-vol',      'Attached', 'Block',    '500 GB', 'eu-west-1',    'eu-west-1',    'Private'],
      ['4', 'db-replica-vol',      'Attached', 'Block',    '500 GB', 'eu-central-1', 'eu-central-1', 'Private'],
      ['5', 'nightly-snapshot-01', 'Archived', 'Snapshot', '480 GB', 'eu-west-1',    'eu-west-1',    'Private'],
    ]),
    statusColors: { Active: '#7ec87e', Attached: '#7ec87e', Archived: '#8a97a5', Detached: '#e0546a' },
    col3Colors: { Object: '#4fa8dc', Block: '#e07d2e', Snapshot: '#e8c07d' },
  },
  Network: {
    headers: ['#', 'Name', 'Status', 'Type', 'CIDR', 'Region', 'Gateway'],
    fieldLabels: { summary: 'Name', assignee: 'Type', status: 'Status', key: 'CIDR', type: 'Region' },
    rows: toRows([
      ['1', 'vpc-main',         'Active', 'VPC',          '10.0.0.0/16', 'eu-west-1',    'eu-west-1',    '10.0.0.1'],
      ['2', 'subnet-public-a',  'Active', 'Subnet',       '10.0.1.0/24', 'eu-west-1',    'eu-west-1',    '10.0.1.1'],
      ['3', 'subnet-private-a', 'Active', 'Subnet',       '10.0.2.0/24', 'eu-west-1',    'eu-west-1',    '10.0.2.1'],
      ['4', 'lb-web',           'Active', 'Load balancer','10.0.1.100',  'eu-west-1',    'eu-west-1',    '3 targets'],
      ['5', 'vpn-gw-01',        'Down',   'VPN gateway',  '10.0.9.1',    'eu-central-1', 'eu-central-1', 'IKEv2'],
    ]),
    statusColors: { Active: '#7ec87e', Down: '#e0546a' },
    col3Colors: {
      VPC: '#4fa8dc',
      Subnet: '#4fa8dc',
      'Load balancer': '#e07d2e',
      'VPN gateway': '#e07d2e',
    },
  },
  IAM: {
    headers: ['#', 'User', 'Status', 'Role', 'Last login', 'MFA', 'Region'],
    fieldLabels: { summary: 'User', assignee: 'Role', status: 'Status', key: 'Last login', type: 'Region' },
    rows: toRows([
      ['1', 'g.aksoy',    'Active',   'Admin',           '2026-08-09 09:12', 'eu-west-1',    'Enabled',  'All'],
      ['2', 'svc-deploy', 'Active',   'CI/CD',           '2026-08-09 07:40', 'eu-west-1',    'N/A',      'eu-west-1'],
      ['3', 'm.demir',    'Active',   'Developer',       '2026-08-08 18:22', 'eu-west-1',    'Enabled',  'eu-west-1'],
      ['4', 'a.yilmaz',   'Disabled', 'Viewer',          '2026-07-30 11:05', 'eu-central-1', 'Disabled', 'eu-central-1'],
      ['5', 'svc-backup', 'Active',   'Backup operator', '2026-08-09 03:00', 'eu-west-1',    'N/A',      'eu-west-1'],
    ]),
    statusColors: { Active: '#7ec87e', Disabled: '#e0546a' },
    col3Colors: {
      Admin: '#e0546a',
      'CI/CD': '#e07d2e',
      Developer: '#4fa8dc',
      Viewer: '#8a97a5',
      'Backup operator': '#e8c07d',
    },
    col5Colors: {
      Enabled: '#7ec87e',
      Disabled: '#e0546a',
      'N/A': '#5c6773',
    },
  },
}
