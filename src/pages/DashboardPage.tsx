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
import {
  ROUTED_TABS,
  SERVICE_TABS,
  SERVICE_MENUS,
  type RoutedTab,
} from '@/features/dashboard/constants'
import {
  VmTabContent,
  DatabaseTabContent,
  IamTabContent,
  NetworkTabContent,
  StorageTabContent,
} from '@/features/dashboard/tabs'
import './tui-dashboard.css'

// ─── Per-tab content dispatcher ──────────────────────────────────────────────
function TabContent({ tab, service }: { tab: RoutedTab; service: ServiceId }) {
  switch (service) {
    case 'VM':       return <VmTabContent tab={tab} />
    case 'Database': return <DatabaseTabContent tab={tab} />
    case 'IAM':      return <IamTabContent tab={tab} />
    case 'Network':  return <NetworkTabContent tab={tab} />
    case 'Storage':  return <StorageTabContent tab={tab} />
    default:         return null
  }
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
