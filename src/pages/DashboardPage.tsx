import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  SERVICE_DATASETS,
  SERVICES,
  serviceIdToSlug,
  slugToServiceId,
  type ServiceId,
} from '@/lib/mockServiceData'
import { useThemeStore } from '@/store/themeStore'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { useVms } from '@/features/vm/hooks'
import { VmCreateForm } from '@/features/vm/pages/VmCreateForm'
import { VmSettingsPage } from '@/features/vm/pages/VmSettingsPage'
import './tui-dashboard.css'

const ROUTED_TABS = [
  'info', 'details', 'create', 'settings',
  // VM
  'console', 'storage', 'network', 'backups', 'metrics',
  // Database
  'connections', 'logs',
  // IAM
  'permissions', 'policies', 'activity',
  // Network
  'firewall', 'routes', 'peering',
  // Storage
  'objects', 'access',
] as const
type RoutedTab = (typeof ROUTED_TABS)[number]

type Tab = { label: string; slug: RoutedTab }

const COMMON_TABS: Tab[] = [
  { label: 'Info', slug: 'info' },
  { label: 'Details', slug: 'details' },
]

const SERVICE_TABS: Record<ServiceId, Tab[]> = {
  VM:       [...COMMON_TABS, { label: 'Console', slug: 'console' }, { label: 'Storage', slug: 'storage' }, { label: 'Network', slug: 'network' }, { label: 'Backups', slug: 'backups' }, { label: 'Metrics', slug: 'metrics' }],
  Database: [...COMMON_TABS, { label: 'Connections', slug: 'connections' }, { label: 'Backups', slug: 'backups' }, { label: 'Logs', slug: 'logs' }, { label: 'Metrics', slug: 'metrics' }],
  IAM:      [...COMMON_TABS, { label: 'Permissions', slug: 'permissions' }, { label: 'Policies', slug: 'policies' }, { label: 'Activity', slug: 'activity' }],
  Network:  [...COMMON_TABS, { label: 'Firewall', slug: 'firewall' }, { label: 'Routes', slug: 'routes' }, { label: 'Peering', slug: 'peering' }],
  Storage:  [...COMMON_TABS, { label: 'Objects', slug: 'objects' }, { label: 'Access', slug: 'access' }, { label: 'Metrics', slug: 'metrics' }],
}

type MenuItem = { label: string; danger?: boolean }

const SERVICE_MENUS: Record<ServiceId, MenuItem[]> = {
  VM:       [{ label: 'Launch VM' }, { label: 'Stop' }, { label: 'Reboot' }, { label: 'Delete', danger: true }],
  Database: [{ label: 'Connect' }, { label: 'Take backup' }, { label: 'Restore' }, { label: 'Delete', danger: true }],
  IAM:      [{ label: 'Add user' }, { label: 'Edit role' }, { label: 'Revoke access', danger: true }],
  Network:  [{ label: 'Add subnet' }, { label: 'Edit firewall' }, { label: 'Create VPN' }, { label: 'Delete', danger: true }],
  Storage:  [{ label: 'Create bucket' }, { label: 'Upload' }, { label: 'Set policy' }, { label: 'Delete', danger: true }],
}

// ─── Per-tab content renderer ────────────────────────────────────────────────
function TabContent({ tab, service }: { tab: RoutedTab; service: ServiceId }) {
  const dim = 'var(--dash-text-dim)'
  const label = 'var(--dash-label)'
  const green = '#7ec87e'
  const amber = '#e8c07d'
  const red = '#e0546a'

  // ── Console ──────────────────────────────────────────────────────────────
  if (tab === 'console') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Serial Console Output</div>
        <div className="fci-console-log">
          <span style={{ color: dim }}>[  0.000000]</span> Linux version 6.1.0-gcp (Debian 6.1.109)<br />
          <span style={{ color: dim }}>[  0.000023]</span> <span style={{ color: green }}>BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable</span><br />
          <span style={{ color: dim }}>[  1.342100]</span> eth0: renamed from veth9a2c<br />
          <span style={{ color: dim }}>[  3.821044]</span> <span style={{ color: green }}>systemd[1]: Started OpenSSH server daemon.</span><br />
          <span style={{ color: dim }}>[  4.210311]</span> systemd[1]: Reached target <span style={{ color: amber }}>Multi-User System</span>.<br />
          <span style={{ color: dim }}>[  4.990211]</span> <span style={{ color: green }}>cloud-init[834]: Cloud-init v.23.3.1 finished</span><br />
          <span style={{ color: dim }}>[  5.002344]</span> kernel: audit: type=1400 audit(1691600000.123:2): apparmor="STATUS"<br />
        </div>
        <div className="fci-section-title" style={{ marginTop: 14 }}>SSH Access</div>
        <div className="fci-metricrow">
          <div>Host: <span style={{ color: label }}>10.128.0.12</span></div>
          <div>Port: <span style={{ color: label }}>22</span></div>
          <div>User: <span style={{ color: label }}>ubuntu</span></div>
          <div>Auth: <span style={{ color: green }}>Key-based</span></div>
        </div>
      </div>
    )
  }

  // ── Storage (VM tab) ─────────────────────────────────────────────────────
  if (tab === 'storage' && service === 'VM') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Attached Volumes</div>
        <table className="fci-table">
          <thead><tr><th>Name</th><th>Size</th><th>Type</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>boot-disk</td><td>50 GB</td><td>SSD</td><td style={{ color: green }}>Attached</td></tr>
            <tr><td style={{ color: label }}>data-disk-1</td><td>200 GB</td><td>HDD</td><td style={{ color: green }}>Attached</td></tr>
          </tbody>
        </table>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Disk I/O</div>
        <div className="fci-metricrow">
          <div>Read: <span style={{ color: green }}>142 MB/s</span></div>
          <div>Write: <span style={{ color: amber }}>89 MB/s</span></div>
          <div>IOPS: <span style={{ color: label }}>4 200</span></div>
          <div>Latency: <span style={{ color: green }}>0.4 ms</span></div>
        </div>
      </div>
    )
  }

  // ── Network (VM tab) ─────────────────────────────────────────────────────
  if (tab === 'network' && service === 'VM') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Interfaces</div>
        <table className="fci-table">
          <thead><tr><th>NIC</th><th>IP (internal)</th><th>IP (external)</th><th>Speed</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>nic0</td><td>10.128.0.12</td><td>34.90.211.44</td><td style={{ color: green }}>10 Gbps</td></tr>
          </tbody>
        </table>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Traffic</div>
        <div className="fci-metricrow">
          <div>Ingress: <span style={{ color: label }}>142 Mbps</span></div>
          <div>Egress: <span style={{ color: label }}>89 Mbps</span></div>
          <div>Dropped: <span style={{ color: green }}>0</span></div>
          <div>Errors: <span style={{ color: green }}>0</span></div>
        </div>
      </div>
    )
  }

  // ── Backups ───────────────────────────────────────────────────────────────
  if (tab === 'backups') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Backup History</div>
        <table className="fci-table">
          <thead><tr><th>ID</th><th>Timestamp</th><th>Size</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>bkp-001</td><td style={{ color: dim }}>2026-08-10 02:00 UTC</td><td>18.4 GB</td><td style={{ color: green }}>✓ Complete</td></tr>
            <tr><td style={{ color: label }}>bkp-002</td><td style={{ color: dim }}>2026-08-09 02:00 UTC</td><td>17.9 GB</td><td style={{ color: green }}>✓ Complete</td></tr>
            <tr><td style={{ color: label }}>bkp-003</td><td style={{ color: dim }}>2026-08-08 02:00 UTC</td><td>17.1 GB</td><td style={{ color: amber }}>⚠ Partial</td></tr>
            <tr><td style={{ color: label }}>bkp-004</td><td style={{ color: dim }}>2026-08-07 02:00 UTC</td><td>16.8 GB</td><td style={{ color: green }}>✓ Complete</td></tr>
          </tbody>
        </table>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Policy</div>
        <div className="fci-metricrow">
          <div>Schedule: <span style={{ color: label }}>Daily 02:00 UTC</span></div>
          <div>Retention: <span style={{ color: label }}>30 days</span></div>
          <div>Encryption: <span style={{ color: green }}>AES-256</span></div>
          <div>Next run: <span style={{ color: amber }}>in 14h 00m</span></div>
        </div>
      </div>
    )
  }

  // ── Metrics ───────────────────────────────────────────────────────────────
  if (tab === 'metrics') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">CPU &amp; Memory</div>
        <div className="fci-metricrow">
          <div>CPU avg (1h): <span style={{ color: green }}>32%</span></div>
          <div>CPU peak: <span style={{ color: amber }}>71%</span></div>
          <div>Mem used: <span style={{ color: amber }}>58%</span></div>
          <div>Mem free: <span style={{ color: green }}>42%</span></div>
        </div>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Disk</div>
        <div className="fci-metricrow">
          <div>Read: <span style={{ color: label }}>142 MB/s</span></div>
          <div>Write: <span style={{ color: label }}>89 MB/s</span></div>
          <div>IOPS: <span style={{ color: label }}>4 200</span></div>
          <div>Latency: <span style={{ color: green }}>0.4 ms</span></div>
        </div>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Uptime</div>
        <div className="fci-metricrow">
          <div>SLA: <span style={{ color: green }}>99.98%</span></div>
          <div>Last incident: <span style={{ color: dim }}>14 days ago</span></div>
          <div>Alerts (open): <span style={{ color: red }}>2</span></div>
          <div>Alerts (7d): <span style={{ color: amber }}>5</span></div>
        </div>
      </div>
    )
  }

  // ── Connections ───────────────────────────────────────────────────────────
  if (tab === 'connections') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Active Connections</div>
        <table className="fci-table">
          <thead><tr><th>Client IP</th><th>DB</th><th>User</th><th>State</th><th>Duration</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>10.128.0.5</td><td>prod_db</td><td>app_user</td><td style={{ color: green }}>idle</td><td>2m 14s</td></tr>
            <tr><td style={{ color: label }}>10.128.0.8</td><td>prod_db</td><td>app_user</td><td style={{ color: amber }}>active</td><td>0m 03s</td></tr>
            <tr><td style={{ color: label }}>10.128.0.11</td><td>analytics</td><td>reader</td><td style={{ color: green }}>idle</td><td>18m 55s</td></tr>
          </tbody>
        </table>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Pool Stats</div>
        <div className="fci-metricrow">
          <div>Max conn: <span style={{ color: label }}>200</span></div>
          <div>Active: <span style={{ color: amber }}>3</span></div>
          <div>Idle: <span style={{ color: green }}>197</span></div>
          <div>Waiting: <span style={{ color: green }}>0</span></div>
        </div>
      </div>
    )
  }

  // ── Logs ──────────────────────────────────────────────────────────────────
  if (tab === 'logs') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Recent Log Entries</div>
        <div className="fci-console-log">
          <span style={{ color: dim }}>2026-08-10 10:58:01 UTC</span> <span style={{ color: green }}>[INFO]</span>  autovacuum: table "prod_db.public.events" — 0 recs<br />
          <span style={{ color: dim }}>2026-08-10 10:57:44 UTC</span> <span style={{ color: green }}>[INFO]</span>  checkpoint starting: time<br />
          <span style={{ color: dim }}>2026-08-10 10:57:44 UTC</span> <span style={{ color: green }}>[INFO]</span>  checkpoint complete: wrote 842 buffers<br />
          <span style={{ color: dim }}>2026-08-10 10:55:12 UTC</span> <span style={{ color: amber }}>[WARN]</span>  slow query detected (1 843 ms): SELECT * FROM events WHERE ...<br />
          <span style={{ color: dim }}>2026-08-10 10:52:01 UTC</span> <span style={{ color: red }}>[ERROR]</span> connection to 10.128.0.99 refused — retrying<br />
          <span style={{ color: dim }}>2026-08-10 10:50:33 UTC</span> <span style={{ color: green }}>[INFO]</span>  database system is ready to accept connections<br />
        </div>
      </div>
    )
  }

  // ── Permissions ───────────────────────────────────────────────────────────
  if (tab === 'permissions') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Assigned Permissions</div>
        <table className="fci-table">
          <thead><tr><th>Resource</th><th>Action</th><th>Effect</th><th>Condition</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>compute.instances.*</td><td>*</td><td style={{ color: green }}>Allow</td><td style={{ color: dim }}>—</td></tr>
            <tr><td style={{ color: label }}>storage.buckets.get</td><td>GET</td><td style={{ color: green }}>Allow</td><td style={{ color: dim }}>region=eu-west</td></tr>
            <tr><td style={{ color: label }}>iam.roles.delete</td><td>DELETE</td><td style={{ color: red }}>Deny</td><td style={{ color: dim }}>—</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── Policies ──────────────────────────────────────────────────────────────
  if (tab === 'policies') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Attached Policies</div>
        <table className="fci-table">
          <thead><tr><th>Policy</th><th>Type</th><th>Attached at</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>ComputeAdminV1</td><td>Managed</td><td style={{ color: dim }}>2026-01-15</td><td style={{ color: green }}>Active</td></tr>
            <tr><td style={{ color: label }}>StorageReadOnly</td><td>Managed</td><td style={{ color: dim }}>2026-03-02</td><td style={{ color: green }}>Active</td></tr>
            <tr><td style={{ color: label }}>DenyIAMDelete</td><td>Custom</td><td style={{ color: dim }}>2026-05-20</td><td style={{ color: amber }}>Review needed</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── Activity ──────────────────────────────────────────────────────────────
  if (tab === 'activity') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Recent Activity</div>
        <div className="fci-console-log">
          <span style={{ color: dim }}>2026-08-10 10:44 UTC</span> <span style={{ color: label }}>root@HEAD</span> — <span style={{ color: green }}>Login</span> from 197.12.34.55<br />
          <span style={{ color: dim }}>2026-08-10 09:12 UTC</span> <span style={{ color: label }}>root@HEAD</span> — <span style={{ color: amber }}>Role updated</span>: ComputeAdmin granted<br />
          <span style={{ color: dim }}>2026-08-09 18:30 UTC</span> <span style={{ color: label }}>ci-bot</span> — <span style={{ color: green }}>API key rotated</span><br />
          <span style={{ color: dim }}>2026-08-09 08:00 UTC</span> <span style={{ color: label }}>root@HEAD</span> — <span style={{ color: green }}>Login</span> from 197.12.34.55<br />
          <span style={{ color: dim }}>2026-08-08 22:14 UTC</span> <span style={{ color: label }}>admin</span> — <span style={{ color: red }}>Failed login</span> from 45.33.10.2<br />
        </div>
      </div>
    )
  }

  // ── Firewall ──────────────────────────────────────────────────────────────
  if (tab === 'firewall') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Firewall Rules</div>
        <table className="fci-table">
          <thead><tr><th>Name</th><th>Direction</th><th>Protocol</th><th>Port</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>allow-ssh</td><td>INGRESS</td><td>TCP</td><td>22</td><td style={{ color: green }}>ALLOW</td></tr>
            <tr><td style={{ color: label }}>allow-http</td><td>INGRESS</td><td>TCP</td><td>80, 443</td><td style={{ color: green }}>ALLOW</td></tr>
            <tr><td style={{ color: label }}>deny-all-in</td><td>INGRESS</td><td>*</td><td>*</td><td style={{ color: red }}>DENY</td></tr>
            <tr><td style={{ color: label }}>allow-all-out</td><td>EGRESS</td><td>*</td><td>*</td><td style={{ color: green }}>ALLOW</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── Routes ────────────────────────────────────────────────────────────────
  if (tab === 'routes') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Route Table</div>
        <table className="fci-table">
          <thead><tr><th>Destination</th><th>Next Hop</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>0.0.0.0/0</td><td>internet-gateway</td><td>1000</td><td style={{ color: green }}>Active</td></tr>
            <tr><td style={{ color: label }}>10.128.0.0/20</td><td>local</td><td>900</td><td style={{ color: green }}>Active</td></tr>
            <tr><td style={{ color: label }}>10.200.0.0/16</td><td>vpn-gateway-1</td><td>800</td><td style={{ color: amber }}>Pending</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── Peering ───────────────────────────────────────────────────────────────
  if (tab === 'peering') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">VPC Peering Connections</div>
        <table className="fci-table">
          <thead><tr><th>Peer VPC</th><th>Region</th><th>CIDR</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>vpc-staging</td><td>eu-west1</td><td>10.200.0.0/16</td><td style={{ color: green }}>Active</td></tr>
            <tr><td style={{ color: label }}>vpc-analytics</td><td>us-central1</td><td>10.210.0.0/16</td><td style={{ color: amber }}>Pending</td></tr>
          </tbody>
        </table>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Shared Services</div>
        <div className="fci-metricrow">
          <div>DNS resolution: <span style={{ color: green }}>Enabled</span></div>
          <div>Route export: <span style={{ color: green }}>Enabled</span></div>
          <div>MTU: <span style={{ color: label }}>1460</span></div>
          <div>Encryption: <span style={{ color: amber }}>Optional</span></div>
        </div>
      </div>
    )
  }

  // ── Objects ───────────────────────────────────────────────────────────────
  if (tab === 'objects') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Bucket Contents</div>
        <table className="fci-table">
          <thead><tr><th>Key</th><th>Size</th><th>Modified</th><th>Class</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>backups/db-2026-08-10.sql.gz</td><td>18.4 GB</td><td style={{ color: dim }}>10 Aug 2026</td><td>STANDARD</td></tr>
            <tr><td style={{ color: label }}>logs/app-2026-08-10.log.gz</td><td>342 MB</td><td style={{ color: dim }}>10 Aug 2026</td><td>NEARLINE</td></tr>
            <tr><td style={{ color: label }}>assets/frontend-v1.2.tar.gz</td><td>89 MB</td><td style={{ color: dim }}>08 Aug 2026</td><td>STANDARD</td></tr>
          </tbody>
        </table>
        <div className="fci-section-title" style={{ marginTop: 14 }}>Storage Stats</div>
        <div className="fci-metricrow">
          <div>Total objects: <span style={{ color: label }}>1 482</span></div>
          <div>Total size: <span style={{ color: label }}>842 GB</span></div>
          <div>Versioning: <span style={{ color: green }}>Enabled</span></div>
          <div>Lifecycle: <span style={{ color: green }}>Active</span></div>
        </div>
      </div>
    )
  }

  // ── Access (Storage) ──────────────────────────────────────────────────────
  if (tab === 'access') {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">IAM Bindings</div>
        <table className="fci-table">
          <thead><tr><th>Principal</th><th>Role</th><th>Condition</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>serviceAccount:app@proj.iam</td><td>roles/storage.objectViewer</td><td style={{ color: dim }}>—</td></tr>
            <tr><td style={{ color: label }}>user:root@HEAD</td><td>roles/storage.admin</td><td style={{ color: dim }}>—</td></tr>
            <tr><td style={{ color: label }}>allUsers</td><td>roles/storage.objectViewer</td><td style={{ color: amber }}>path prefix: /public/</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── Info / Details / fallback ─────────────────────────────────────────────
  return null // rendered separately in the main body
}

// ─── Search helper ───────────────────────────────────────────────────────────
type SearchResult =
  | { kind: 'tab'; label: string; slug: RoutedTab }
  | { kind: 'action'; label: string; danger?: boolean }

function getSearchResults(serviceId: ServiceId, query: string): SearchResult[] {
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

export function DashboardPage() {
  const { serviceId: serviceSlug, tab: tabSlug } = useParams<{ serviceId: string; tab: string }>()
  const navigate = useNavigate()

  const activeService = slugToServiceId(serviceSlug)
  const activeTab: RoutedTab = ROUTED_TABS.includes(tabSlug as RoutedTab) ? (tabSlug as RoutedTab) : 'details'
  const theme = useThemeStore((state) => state.theme)

  const [searchQuery, setSearchQuery] = useState<Record<ServiceId, string>>({
    VM: '',
    Database: '',
    IAM: '',
    Network: '',
    Storage: '',
  })
  const [focusedService, setFocusedService] = useState<ServiceId | null>(null)
  const [linkSearchQuery, setLinkSearchQuery] = useState('')
  const [linkSearchFocused, setLinkSearchFocused] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const vmsQuery = useVms()

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.fci-servicebox') && !target.closest('.fci-dropdown')) {
        setFocusedService(null)
        setProfileOpen(false)
      }
    }
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [])

  if (!activeService) {
    return <Navigate to="/services/vm/details" replace />
  }

  const validTabsForService = SERVICE_TABS[activeService!].map((t) => t.slug)
  const isCreateTab = activeTab === 'create' && activeService === 'VM'
  const isSettingsTab = activeTab === 'settings' && activeService === 'VM'
  if (tabSlug && !isCreateTab && !isSettingsTab && !validTabsForService.includes(tabSlug as RoutedTab)) {
    return <Navigate to={`/services/${serviceSlug}/details`} replace />
  }

  const dataset = SERVICE_DATASETS[activeService]
  const selectedRow = dataset.rows.find((row) => row.id === selectedRowId) ?? dataset.rows[0] ?? null

  function selectService(id: ServiceId) {
    setSelectedRowId(null)
    navigate(`/services/${serviceIdToSlug(id)}/${activeTab}`)
  }

  function selectTab(slug: RoutedTab) {
    navigate(`/services/${serviceSlug}/${slug}`)
  }

  function toggleProfile(event: React.MouseEvent) {
    event.stopPropagation()
    setProfileOpen((prev) => !prev)
    setFocusedService(null)
  }

  return (
    <div className="fci-page" data-theme={theme}>
      <div className="fci-tui">
        <div className="fci-tui-title">Free Cloud Initiative</div>

      <div className="fci-topbar">
        <div className="fci-topgrid">
          {SERVICES.map((service) => {
            const isActive = service.id === activeService
            const isFocused = focusedService === service.id
            const query = searchQuery[service.id]
            const results = getSearchResults(service.id, query)
            return (
              <div
                key={service.id}
                className={`fci-box fci-servicebox${isActive ? ' fci-active-service' : ''}`}
              >
                <div
                  className="fci-box-label"
                  style={{ cursor: 'pointer' }}
                  onClick={() => selectService(service.id)}
                >
                  {service.id}
                </div>
                <div
                  className={`fci-terminal-wrap${isFocused ? ' fci-focused' : ''}`}
                  style={{ '--fci-chars': query.length } as React.CSSProperties}
                >
                  <input
                    type="text"
                    className="fci-service-search"
                    placeholder="search sections…"
                    value={query}
                    onFocus={() => setFocusedService(service.id)}
                    onChange={(e) => {
                      setSearchQuery((prev) => ({ ...prev, [service.id]: e.target.value }))
                      setFocusedService(service.id)
                    }}
                    onBlur={() => setTimeout(() => setFocusedService(null), 120)}
                  />
                </div>
                <div className="fci-box-key">({service.hotkey})</div>
                {isFocused && query.trim() && (
                  <div className="fci-search-dropdown">
                    {results.length > 0 ? (
                      results.map((result) =>
                        result.kind === 'tab' ? (
                          <div
                            key={result.slug}
                            className="fci-dd-item fci-search-result"
                            onMouseDown={() => {
                              setSearchQuery((prev) => ({ ...prev, [service.id]: '' }))
                              setFocusedService(null)
                              navigate(`/services/${serviceIdToSlug(service.id)}/${result.slug}`)
                              setSelectedRowId(null)
                            }}
                          >
                            <span className="fci-search-kind fci-kind-tab">tab</span>
                            {result.label}
                          </div>
                        ) : (
                          <div
                            key={result.label}
                            className={`fci-dd-item fci-search-result${result.danger ? ' fci-dd-item-danger' : ''}`}
                            onMouseDown={() => {
                              setSearchQuery((prev) => ({ ...prev, [service.id]: '' }))
                              setFocusedService(null)
                              window.alert(`${result.label} — ${service.id} (demo)`)
                            }}
                          >
                            <span className="fci-search-kind fci-kind-action">action</span>
                            {result.label}
                          </div>
                        )
                      )
                    ) : (
                      <div className="fci-search-no-results">No section available</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div
          className={`fci-box fci-profile fci-dropdown${profileOpen ? ' fci-open' : ''}`}
          role="button"
          tabIndex={0}
          onClick={toggleProfile}
        >
          <div className="fci-box-label">Profile</div>
          <span className="fci-profile-icon">&#9786;</span>
          <span className="fci-profile-name">root@HEAD</span>
          <div className="fci-dd-arrow">&#9660;</div>
          <div className="fci-box-key">(p)</div>
          <div className="fci-dd-menu">
            <div className="fci-dd-item" onClick={(e) => e.stopPropagation()}>My Account</div>
            <div className="fci-dd-item" onClick={(e) => e.stopPropagation()}>Settings</div>
            <div className="fci-dd-item fci-dd-item-danger" onClick={(e) => e.stopPropagation()}>Sign out</div>
          </div>
        </div>
      </div>

      <div className="fci-linkgrid">
        <button
          id="btn-action-add"
          type="button"
          className="fci-linkbtn fci-action-add"
          onClick={() =>
            activeService === 'VM'
              ? navigate('/services/vm/create')
              : window.alert(`Add new ${activeService} resource (demo)`)
          }
        >
          + Create
        </button>
        <button
          id="btn-action-edit"
          type="button"
          className="fci-linkbtn fci-action-edit"
          onClick={() =>
            activeService === 'VM'
              ? vmsQuery.refetch()
              : window.alert(`Refresh ${activeService} (demo)`)
          }
        >
          Refresh
        </button>
        <button
          id="btn-action-delete"
          type="button"
          className="fci-linkbtn fci-action-delete"
          onClick={() =>
            activeService === 'VM'
              ? navigate('/services/vm/settings')
              : window.alert(`Settings (demo)`)
          }
        >
          Settings
        </button>
        <div className="fci-linkgrid-divider" />
        <button
          type="button"
          className="fci-linkbtn fci-docs"
          onClick={() => window.open('https://freecloudinitiative.github.io/docs/', '_blank')}
        >
          Docs
        </button>
        <button
          type="button"
          className="fci-linkbtn fci-grafana"
          onClick={() => window.open('https://grafana.example.com', '_blank')}
        >
          Grafana
        </button>
        <button
          type="button"
          className="fci-linkbtn fci-prom"
          onClick={() => window.open('https://prometheus.example.com', '_blank')}
        >
          Prometheus
        </button>
        <button
          type="button"
          className="fci-linkbtn fci-loki"
          onClick={() => window.open('https://loki.example.com', '_blank')}
        >
          Loki
        </button>
        <button
          type="button"
          className="fci-linkbtn fci-chaos"
          onClick={() => window.open('https://chaos.example.com', '_blank')}
        >
          Chaos Demo
        </button>
        <button
          type="button"
          className="fci-linkbtn fci-arch"
          onClick={() => window.open('https://architecture.example.com', '_blank')}
        >
          Architecture
        </button>
        <div className="fci-box">
          <div className="fci-box-label">Search</div>
          <div
            className={`fci-terminal-wrap${linkSearchFocused ? ' fci-focused' : ''}`}
            style={{ '--fci-chars': linkSearchQuery.length } as React.CSSProperties}
          >
            <input
              type="text"
              className="fci-service-search"
              placeholder="Type to search…"
              value={linkSearchQuery}
              onChange={(e) => setLinkSearchQuery(e.target.value)}
              onFocus={() => setLinkSearchFocused(true)}
              onBlur={() => setLinkSearchFocused(false)}
            />
          </div>
          <div className="fci-box-key">(s)</div>
        </div>
        <button
          type="button"
          className="fci-searchbtn"
          onClick={() => window.alert('Arama filtreleri uygulandı (demo)')}
        >
          Search
        </button>
      </div>

      <div className="fci-maingrid">
        {isCreateTab ? (
          <VmCreateForm
            onCancel={() => navigate('/services/vm/details')}
            onSuccess={() => navigate('/services/vm/details')}
          />
        ) : isSettingsTab ? (
          <VmSettingsPage />
        ) : (
          <>
        <div className="fci-itemsbox">
          <div className="fci-box-label">{activeService}</div>
          <div className="fci-itemslist">
            <table className="fci-table">
              <thead>
                <tr>
                  {dataset.headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={dataset.headers.length}
                      style={{
                        textAlign: 'center',
                        padding: '2.5rem 1rem',
                        color: 'var(--dash-text-dim)',
                        letterSpacing: '0.08em',
                        fontSize: '0.85rem',
                      }}
                    >
                      ⏳ Coming Soon — no data available yet
                    </td>
                  </tr>
                ) : (
                  dataset.rows.map((row) => {
                    const isSelected = row.id === selectedRow!.id
                    return (
                      <tr
                        key={row.id}
                        style={{
                          background: isSelected ? 'var(--dash-row-selected-bg)' : 'transparent',
                          color: isSelected ? 'var(--dash-row-selected-text)' : 'var(--dash-text)',
                        }}
                        onClick={() => setSelectedRowId(row.id)}
                      >
                        <td>{row.id}</td>
                        <td style={{ color: isSelected ? 'var(--dash-row-selected-text)' : 'var(--dash-label)' }}>
                          {row.name}
                        </td>
                        <td style={{ color: dataset.statusColors[row.status] ?? 'var(--dash-text)' }}>
                          {row.status}
                        </td>
                        <td style={{ color: dataset.col3Colors[row.col3] ?? 'var(--dash-text)' }}>{row.col3}</td>
                        <td>{row.col4}</td>
                        <td style={{ color: dataset.col5Colors?.[row.col5] ?? 'var(--dash-text-dim)' }}>{row.col5}</td>
                        <td style={{ color: 'var(--dash-text-dim)' }}>{row.col6}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="fci-detail-panel">
          <div className="fci-tabs">
            {SERVICE_TABS[activeService].map(({ label, slug }) => (
              <span
                key={label}
                className={slug === activeTab ? 'fci-active' : ''}
                style={{ cursor: 'pointer' }}
                onClick={() => selectTab(slug)}
              >
                {label}
              </span>
            ))}
          </div>

          {selectedRow ? (
            <>
              {/* Info tab ─ summary fields */}
              {activeTab === 'info' && (
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
              )}

              {/* Details tab ─ metrics / network / security */}
              {activeTab === 'details' && (
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

              {/* All other tabs */}
              {activeTab !== 'info' && activeTab !== 'details' && (
                <TabContent tab={activeTab} service={activeService} />
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
        </>
        )}
      </div>

      <div className="fci-footer">
        <div className="fci-footer-shortcuts">
          <span>
            <b>/</b> Find
          </span>
          <span>
            <b>^s</b> Search
          </span>
          <span>
            <b>^n</b> New item
          </span>
          <span>
            <b>^c</b> Copy
          </span>
          <span>
            <b>^d</b> Delete
          </span>
          <span>
            <b>^i</b> Info
          </span>
        </div>

        <ThemeSwitcher />
      </div>
      </div>
    </div>
  )
}
