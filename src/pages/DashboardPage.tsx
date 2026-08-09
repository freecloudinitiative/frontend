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
import './tui-dashboard.css'

const ROUTED_TABS = ['info', 'details'] as const
type RoutedTab = (typeof ROUTED_TABS)[number]

type Tab = { label: string; slug: RoutedTab | null }

const COMMON_TABS: Tab[] = [
  { label: 'Info', slug: 'info' },
  { label: 'Details', slug: 'details' },
]

const SERVICE_TABS: Record<ServiceId, Tab[]> = {
  VM:       [...COMMON_TABS, { label: 'Console', slug: null }, { label: 'Storage', slug: null }, { label: 'Network', slug: null }, { label: 'Backups', slug: null }, { label: 'Metrics', slug: null }],
  Database: [...COMMON_TABS, { label: 'Connections', slug: null }, { label: 'Backups', slug: null }, { label: 'Logs', slug: null }, { label: 'Metrics', slug: null }],
  IAM:      [...COMMON_TABS, { label: 'Permissions', slug: null }, { label: 'Policies', slug: null }, { label: 'Activity', slug: null }],
  Network:  [...COMMON_TABS, { label: 'Firewall', slug: null }, { label: 'Routes', slug: null }, { label: 'Peering', slug: null }],
  Storage:  [...COMMON_TABS, { label: 'Objects', slug: null }, { label: 'Access', slug: null }, { label: 'Metrics', slug: null }],
}

type MenuItem = { label: string; danger?: boolean }

const SERVICE_MENUS: Record<ServiceId, MenuItem[]> = {
  VM:       [{ label: 'Launch VM' }, { label: 'Stop' }, { label: 'Reboot' }, { label: 'Delete', danger: true }],
  Database: [{ label: 'Connect' }, { label: 'Take backup' }, { label: 'Restore' }, { label: 'Delete', danger: true }],
  IAM:      [{ label: 'Add user' }, { label: 'Edit role' }, { label: 'Revoke access', danger: true }],
  Network:  [{ label: 'Add subnet' }, { label: 'Edit firewall' }, { label: 'Create VPN' }, { label: 'Delete', danger: true }],
  Storage:  [{ label: 'Create bucket' }, { label: 'Upload' }, { label: 'Set policy' }, { label: 'Delete', danger: true }],
}

export function DashboardPage() {
  const { serviceId: serviceSlug, tab: tabSlug } = useParams<{ serviceId: string; tab: string }>()
  const navigate = useNavigate()

  const activeService = slugToServiceId(serviceSlug)
  const activeTab: RoutedTab = tabSlug === 'info' ? 'info' : 'details'
  const theme = useThemeStore((state) => state.theme)

  const [openDropdown, setOpenDropdown] = useState<ServiceId | null>(null)
  const [ddSelected, setDdSelected] = useState<Record<ServiceId, string>>({
    VM: 'Select action',
    Database: 'Select action',
    IAM: 'Select action',
    Network: 'Select action',
    Storage: 'Select action',
  })
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.fci-dropdown')) {
        setOpenDropdown(null)
        setProfileOpen(false)
      }
    }
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [])

  if (!activeService || (tabSlug && !ROUTED_TABS.includes(tabSlug as RoutedTab))) {
    return <Navigate to="/services/vm/details" replace />
  }

  const dataset = SERVICE_DATASETS[activeService]
  const selectedRow = dataset.rows.find((row) => row.id === selectedRowId) ?? dataset.rows[0]

  function selectService(id: ServiceId) {
    setSelectedRowId(null)
    navigate(`/services/${serviceIdToSlug(id)}/${activeTab}`)
  }

  function selectTab(slug: RoutedTab) {
    navigate(`/services/${serviceSlug}/${slug}`)
  }

  function toggleDropdown(id: ServiceId) {
    setOpenDropdown((prev) => (prev === id ? null : id))
  }

  function selectDdItem(id: ServiceId, event: React.MouseEvent) {
    event.stopPropagation()
    setDdSelected((prev) => ({ ...prev, [id]: 'Select action' }))
    setOpenDropdown(null)
  }

  function toggleProfile(event: React.MouseEvent) {
    event.stopPropagation()
    setProfileOpen((prev) => !prev)
    setOpenDropdown(null)
  }

  return (
    <div className="fci-page" data-theme={theme}>
      <div className="fci-tui">
        <div className="fci-tui-title">Free Cloud Initiative</div>

      <div className="fci-topbar">
        <div className="fci-topgrid">
          {SERVICES.map((service) => {
            const isActive = service.id === activeService
            const isOpen = openDropdown === service.id
            return (
              <div
                key={service.id}
                className={`fci-box fci-dropdown${isActive ? ' fci-active-service' : ''}${isOpen ? ' fci-open' : ''}`}
                onClick={() => toggleDropdown(service.id)}
              >
                <div
                  className="fci-box-label"
                  onClick={(event) => {
                    event.stopPropagation()
                    selectService(service.id)
                  }}
                >
                  {service.id}
                </div>
                <div className="fci-dd-selected">{ddSelected[service.id]}</div>
                <div className="fci-dd-arrow">&#9660;</div>
                <div className="fci-box-key">({service.hotkey})</div>
                <div className="fci-dd-menu">
                  {SERVICE_MENUS[service.id].map(({ label, danger }) => (
                    <div
                      key={label}
                      className={`fci-dd-item${danger ? ' fci-dd-item-danger' : ''}`}
                      onClick={(event) => selectDdItem(service.id, event)}
                    >
                      {label}
                    </div>
                  ))}
                </div>
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
          <span className="fci-profile-name">g.aksoy</span>
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
          type="button"
          className="fci-linkbtn fci-docs"
          onClick={() => window.open('https://docs.example.com', '_blank')}
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
          <input type="text" placeholder="Type to search..." />
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
                {dataset.rows.map((row) => {
                  const isSelected = row.id === selectedRow.id
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
                })}
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
                style={{ cursor: slug ? 'pointer' : 'default' }}
                onClick={slug ? () => selectTab(slug) : undefined}
              >
                {label}
              </span>
            ))}
          </div>

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

          <div className="fci-section-title">Metrics</div>
          <div className="fci-metricrow">
            <div>
              CPU: <span style={{ color: '#7ec87e' }}>32%</span>
            </div>
            <div>
              Memory: <span style={{ color: '#e8c07d' }}>58%</span>
            </div>
            <div>
              Disk I/O: <span style={{ color: 'var(--dash-label)' }}>14 MB/s</span>
            </div>
            <div>
              Uptime: <span style={{ color: 'var(--dash-text)' }}>99.98%</span>
            </div>
          </div>

          <div className="fci-section-title">Network</div>
          <div className="fci-metricrow">
            <div>
              Ingress: <span style={{ color: 'var(--dash-label)' }}>142 Mbps</span>
            </div>
            <div>
              Egress: <span style={{ color: 'var(--dash-label)' }}>89 Mbps</span>
            </div>
            <div>
              Latency: <span style={{ color: '#7ec87e' }}>12ms</span>
            </div>
            <div>
              Packet loss: <span style={{ color: '#7ec87e' }}>0.01%</span>
            </div>
          </div>

          <div className="fci-section-title">Security</div>
          <div className="fci-metricrow">
            <div>
              Open alerts: <span style={{ color: '#e0546a' }}>2</span>
            </div>
            <div>
              Failed logins: <span style={{ color: '#e8c07d' }}>7</span>
            </div>
            <div>
              Patch status: <span style={{ color: '#7ec87e' }}>up to date</span>
            </div>
            <div>
              Firewall: <span style={{ color: '#7ec87e' }}>active</span>
            </div>
          </div>
        </div>
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
