import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  SERVICE_DATASETS,
  SERVICES,
  serviceIdToSlug,
  slugToServiceId,
  type ServiceId,
  type ServiceRow,
} from '@/lib/mockServiceData'
import { useThemeStore } from '@/store/themeStore'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { useVms, useDeleteVm, useUpdateVm, useVmMetrics } from '@/features/vm/hooks'
import type { Vm } from '@/features/vm/types'
import { VmCreateForm } from '@/features/vm/pages/VmCreateForm'
import { VmSettingsPage } from '@/features/vm/pages/VmSettingsPage'
import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'
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
import { DashboardModal } from '@/features/dashboard/DashboardModal'
import { useSortableRows } from '@/features/dashboard/useSortableRows'
import { SortableHeader } from '@/features/dashboard/SortableHeader'
import './tui-dashboard.css'

// ─── Per-tab content dispatcher ──────────────────────────────────────────────
function TabContent({ tab, service, selectedVmId, vmName }: { tab: RoutedTab; service: ServiceId; selectedVmId: string | null; vmName?: string }) {
  switch (service) {
    case 'VM':       return <VmTabContent tab={tab} selectedVmId={selectedVmId} vmName={vmName} />
    case 'Database': return <DatabaseTabContent tab={tab} />
    case 'IAM':      return <IamTabContent tab={tab} />
    case 'Network':  return <NetworkTabContent tab={tab} />
    case 'Storage':  return <StorageTabContent tab={tab} />
    default:         return null
  }
}

// ─── VM live usage bars (replaces the row Settings button) ───────────────────
function VmUsageCell({ vmId }: { vmId: string }) {
  const { data: metrics } = useVmMetrics(vmId, '30m', { refetchInterval: 5000 })
  const latest = metrics?.[metrics.length - 1]

  return (
    <div className="fci-usage-cell">
      <AsciiProgressBar label="C" value={latest?.cpu ?? 0} width={10} />
      <AsciiProgressBar label="M" value={latest?.memory ?? 0} width={10} />
    </div>
  )
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

// ── Modal action types ───────────────────────────────────────────────────────
type ModalAction = 'stop' | 'reboot' | 'delete' | null

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
  const [topSearchQuery, setTopSearchQuery] = useState('')
  const [topSearchFocused, setTopSearchFocused] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [noSelectionMsg, setNoSelectionMsg] = useState(false)
  const noSelectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rebootTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isActionInFlightRef = useRef(false)

  // ── VM mutations ───────────────────────────────────────────────────────────
  const deleteVmMutation = useDeleteVm()
  const updateVmMutation = useUpdateVm()

  const vmsQuery = useVms()

  function clearRebootTimer() {
    if (rebootTimerRef.current) {
      clearTimeout(rebootTimerRef.current)
      rebootTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearRebootTimer()
      if (noSelectionTimer.current) clearTimeout(noSelectionTimer.current)
    }
  }, [])

  // ── VM row transformation ─────────────────────────────────────────────────
  const vmRows: ServiceRow[] = (vmsQuery.data ?? []).map((vm: Vm) => ({
    id: vm.id,
    name: vm.name,
    status: vm.status.charAt(0).toUpperCase() + vm.status.slice(1),
    col3: vm.os,
    col4: vm.ipAddress,
    col5: `${vm.memory} GB`,
    col6: `${vm.cpu} vCPU`,
    region: vm.region,
  }))



  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.fci-servicebox') && !target.closest('.fci-dropdown')) {
        setFocusedService(null)
        setProfileOpen(false)
      }
      if (
        !target.closest('.fci-table') &&
        !target.closest('.fci-detail-panel') &&
        !target.closest('.fci-modal-overlay') &&
        !target.closest('.fci-box-keys-top')
      ) {
        setSelectedRowId(null)
      }
    }
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [])

  // For VM, use live MSW data; for all other services use static dataset rows
  const activeRows: ServiceRow[] = activeService === 'VM' ? vmRows : (activeService ? SERVICE_DATASETS[activeService].rows : [])

  // ── Sorting (depends on activeRows, so placed after it; must run unconditionally,
  //     before the early `return`s below, to satisfy rules-of-hooks) ────────────
  const { sortedRows, sortState, toggleSort } = useSortableRows(activeRows)

  if (!activeService) {
    return <Navigate to="/services/vm/details" replace />
  }

  const dataset = SERVICE_DATASETS[activeService]
  const validTabsForService = SERVICE_TABS[activeService].map((t) => t.slug)
  const isCreateTab = activeTab === 'create' && activeService === 'VM'
  const isSettingsTab = activeTab === 'settings' && activeService === 'VM'
  if (tabSlug && !isCreateTab && !isSettingsTab && !validTabsForService.includes(tabSlug as RoutedTab)) {
    return <Navigate to={`/services/${serviceSlug}/details`} replace />
  }

  const selectedRow = selectedRowId ? (activeRows.find((row) => row.id === selectedRowId) ?? null) : null
  // Keep a reference to the full Vm object for the detail panel
  const selectedVm: Vm | null =
    activeService === 'VM' && selectedRow
      ? (vmsQuery.data ?? []).find((vm: Vm) => vm.id === selectedRow.id) ?? null
      : null

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

  // ── VM action helpers ──────────────────────────────────────────────────────
  function openVmAction(action: ModalAction) {
    if (!selectedRowId || !selectedVm) {
      // No explicit row selected — show brief inline notice
      setNoSelectionMsg(true)
      if (noSelectionTimer.current) clearTimeout(noSelectionTimer.current)
      noSelectionTimer.current = setTimeout(() => setNoSelectionMsg(false), 2500)
      return
    }
    setModalAction(action)
  }

  function handleMenuAction(serviceId: ServiceId, label: string) {
    if (serviceId === 'VM') {
      if (label === 'Launch VM') { navigate('/services/vm/create'); return }
      if (label === 'Stop')   { openVmAction('stop');   return }
      if (label === 'Reboot') { openVmAction('reboot'); return }
      if (label === 'Delete') { openVmAction('delete'); return }
    }
    window.alert(`${label} — ${serviceId} (demo)`)
  }

  async function confirmModalAction() {
    if (!selectedVm || !modalAction || isActionInFlightRef.current) return
    isActionInFlightRef.current = true
    const id = selectedVm.id

    try {
      if (modalAction === 'delete') {
        clearRebootTimer()
        await deleteVmMutation.mutateAsync(id)
        setSelectedRowId(null)
      } else if (modalAction === 'stop') {
        clearRebootTimer()
        await updateVmMutation.mutateAsync({ id, partial: { status: 'stopped' } })
      } else if (modalAction === 'reboot') {
        clearRebootTimer()
        await updateVmMutation.mutateAsync({ id, partial: { status: 'pending' } })
        rebootTimerRef.current = setTimeout(async () => {
          try {
            await updateVmMutation.mutateAsync({ id, partial: { status: 'running' } })
          } catch {
            
          } finally {
            rebootTimerRef.current = null
          }
        }, 2000)
      }
      setModalAction(null)
    } finally {
      isActionInFlightRef.current = false
    }
  }

  const modalTitle =
    modalAction === 'delete' ? 'Confirm Delete'
    : modalAction === 'stop'   ? 'Confirm Stop'
    : modalAction === 'reboot' ? 'Confirm Reboot'
    : ''

  const modalIsPending = deleteVmMutation.isPending || updateVmMutation.isPending

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
                              handleMenuAction(service.id, result.label)
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

        <div className="fci-box fci-topsearch-box">
          <div className="fci-box-label">Search</div>
          <div
            className={`fci-terminal-wrap${topSearchFocused ? ' fci-focused' : ''}`}
            style={{ '--fci-chars': topSearchQuery.length } as React.CSSProperties}
          >
            <input
              type="text"
              className="fci-service-search"
              placeholder="search all…"
              value={topSearchQuery}
              onFocus={() => setTopSearchFocused(true)}
              onChange={(e) => setTopSearchQuery(e.target.value)}
              onBlur={() => setTopSearchFocused(false)}
            />
          </div>
          <div className="fci-box-key">(s)</div>
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

      <div className="fci-maingrid">
        {isCreateTab ? (
          <VmCreateForm
            onCancel={() => navigate('/services/vm/details')}
            onSuccess={() => navigate('/services/vm/details')}
          />
        ) : isSettingsTab ? (
          <VmSettingsPage onBack={() => navigate('/services/vm/details')} />
        ) : (
          <>
        <div className="fci-itemsbox">
          <div className="fci-box-label">{activeService}</div>
          <div className="fci-box-keys-top">
            <button
              id="btn-action-add"
              type="button"
              className="fci-linkbtn fci-topbtn-add"
              onClick={() =>
                activeService === 'VM'
                  ? navigate('/services/vm/create')
                  : window.alert(`Add new ${activeService} resource (demo)`)
              }
              aria-label="Create"
              title="Create"
            >
              +
            </button>
            <button
              id="btn-action-refresh"
              type="button"
              className="fci-linkbtn fci-topbtn-refresh"
              onClick={() =>
                activeService === 'VM'
                  ? vmsQuery.refetch()
                  : window.alert(`Refresh ${activeService} (demo)`)
              }
              aria-label="Refresh"
              title="Refresh"
            >
              ↻
            </button>
            <button
              id="btn-action-settings"
              type="button"
              className="fci-linkbtn fci-topbtn-settings"
              onClick={() =>
                activeService === 'VM'
                  ? navigate('/services/vm/settings')
                  : window.alert(`Settings (demo)`)
              }
              aria-label="Settings"
              title="Settings"
            >
              ⚙
            </button>
            {/* Inline notice when no VM is selected but an action was triggered */}
            {activeService === 'VM' && noSelectionMsg && (
              <span className="fci-inline-notice">Select a VM first</span>
            )}
          </div>
          <div className="fci-itemslist">
            <table className="fci-table">
              <thead>
                <tr>
                  {dataset.headers.map((header, i) => (
                    <SortableHeader
                      key={header}
                      label={header}
                      colIndex={i}
                      dir={sortState.colIndex === i ? sortState.dir : null}
                      onSort={toggleSort}
                    />
                  ))}
                  {activeService === 'VM' && <th style={{ width: '1%', whiteSpace: 'nowrap' }}></th>}
                </tr>
              </thead>
              <tbody>
                {/* VM: loading state */}
                {activeService === 'VM' && vmsQuery.isLoading && (
                  <tr>
                    <td
                      colSpan={activeService === 'VM' ? dataset.headers.length + 1 : dataset.headers.length}
                      style={{
                        textAlign: 'center',
                        padding: '2.5rem 1rem',
                        color: 'var(--dash-text-dim)',
                        letterSpacing: '0.08em',
                        fontSize: '0.85rem',
                        animation: 'fci-blink 1s step-start infinite',
                      }}
                    >
                      ⏳ Loading…
                    </td>
                  </tr>
                )}
                {/* VM: error state */}
                {activeService === 'VM' && vmsQuery.isError && (
                  <tr>
                    <td
                      colSpan={activeService === 'VM' ? dataset.headers.length + 1 : dataset.headers.length}
                      style={{
                        textAlign: 'center',
                        padding: '2.5rem 1rem',
                        color: '#e0546a',
                        letterSpacing: '0.08em',
                        fontSize: '0.85rem',
                      }}
                    >
                      ✗ Failed to load VM data — {vmsQuery.error instanceof Error ? vmsQuery.error.message : 'Unknown error'}
                    </td>
                  </tr>
                )}
                {/* All rows (VM after data loaded, or non-VM services) */}
                {(activeService !== 'VM' || (!vmsQuery.isLoading && !vmsQuery.isError)) && (
                  activeRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeService === 'VM' ? dataset.headers.length + 1 : dataset.headers.length}
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
                    sortedRows.map((row) => {
                      const isSelected = selectedRow !== null && row.id === selectedRow.id
                      return (
                        <tr
                          key={row.id}
                          style={{
                            background: isSelected ? 'var(--dash-row-selected-bg)' : 'transparent',
                            color: isSelected ? 'var(--dash-row-selected-text)' : 'var(--dash-text)',
                          }}
                          onClick={() => setSelectedRowId(row.id)}
                        >
                          <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--dash-text-dim)', maxWidth: '6ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.id.slice(0, 8)}</td>
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
                          {activeService === 'VM' && (
                            <td
                              className="fci-td-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="fci-vm-actions">
                              {/* Live CPU/Memory usage */}
                              <VmUsageCell vmId={row.id} />
                              {/* Connect / Terminal */}
                              <button
                                type="button"
                                title="Connect via terminal"
                                onClick={() => window.alert(`Connect to ${row.name} (demo)`)}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.45rem',
                                  marginRight: '0.3rem',
                                  background: 'transparent',
                                  border: '1px solid var(--dash-label)',
                                  color: 'var(--dash-label)',
                                  borderRadius: '2px',
                                  cursor: 'pointer',
                                  letterSpacing: '0.04em',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#7ec87e'
                                  e.currentTarget.style.color = '#7ec87e'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--dash-label)'
                                  e.currentTarget.style.color = 'var(--dash-label)'
                                }}
                              >
                                &#x25BA; Connect
                              </button>
                              {/* Delete */}
                              <button
                                type="button"
                                title="Delete VM"
                                onClick={() => {
                                  setSelectedRowId(row.id)
                                  setModalAction('delete')
                                }}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.45rem',
                                  background: 'transparent',
                                  border: '1px solid #e0546a',
                                  color: '#e0546a',
                                  borderRadius: '2px',
                                  cursor: 'pointer',
                                  letterSpacing: '0.04em',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#e0546a22'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent'
                                }}
                              >
                                ✕ Delete
                              </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )
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
                  {activeService === 'VM' && selectedVm ? (
                    // VM: show real data from the Vm object
                    <>
                      <div className="fci-fieldbox">
                        <div className="fci-box-label">Name</div>
                        <div className="fci-box-value">{selectedVm.name}</div>
                      </div>
                      <div className="fci-fieldrow">
                        <div className="fci-fieldbox">
                          <div className="fci-box-label">OS</div>
                          <div className="fci-box-value">{selectedVm.os}</div>
                        </div>
                        <div className="fci-fieldbox">
                          <div className="fci-box-label">Status</div>
                          <div
                            className="fci-box-value"
                            style={{
                              color:
                                dataset.statusColors[
                                  selectedVm.status.charAt(0).toUpperCase() + selectedVm.status.slice(1)
                                ] ?? 'var(--dash-text)',
                            }}
                          >
                            {selectedVm.status.charAt(0).toUpperCase() + selectedVm.status.slice(1)}
                          </div>
                        </div>
                      </div>
                      <div className="fci-fieldrow">
                        <div className="fci-fieldbox">
                          <div className="fci-box-label">IP Address</div>
                          <div className="fci-box-value">{selectedVm.ipAddress}</div>
                        </div>
                        <div className="fci-fieldbox">
                          <div className="fci-box-label">Region</div>
                          <div className="fci-box-value">{selectedVm.region}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Other services: generic fieldLabels mapping
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
                </>
              )}

              {/* Details tab ─ VM-specific Instance section + shared Metrics/Network/Security */}
              {activeTab === 'details' && (
                <>
                  {activeService === 'VM' && selectedVm && (
                    <>
                      <div className="fci-section-title">Instance</div>
                      <div className="fci-metricrow">
                        <div>CPU: <span style={{ color: 'var(--dash-label)' }}>{selectedVm.cpu} vCPU</span></div>
                        <div>Memory: <span style={{ color: 'var(--dash-label)' }}>{selectedVm.memory} GB</span></div>
                        <div>Disk: <span style={{ color: 'var(--dash-label)' }}>{selectedVm.disk} GB</span></div>
                        <div>Disk Type: <span style={{ color: 'var(--dash-label)' }}>{selectedVm.diskType}</span></div>
                        <div>Created: <span style={{ color: 'var(--dash-text-dim)' }}>{new Date(selectedVm.createdAt).toLocaleDateString()}</span></div>
                      </div>
                    </>
                  )}
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
                <TabContent
                  tab={activeTab}
                  service={activeService}
                  selectedVmId={activeService === 'VM' ? selectedRowId : null}
                  vmName={activeService === 'VM' ? (selectedVm?.name ?? selectedRow?.name) : undefined}
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

        <div className="fci-footer-links">
          <button type="button" className="fci-pill-docs"       onClick={() => window.open('https://freecloudinitiative.github.io/docs/', '_blank')}>Docs</button>
          <button type="button" className="fci-pill-grafana"    onClick={() => window.open('https://grafana.example.com', '_blank')}>Grafana</button>
          <button type="button" className="fci-pill-prometheus" onClick={() => window.open('https://prometheus.example.com', '_blank')}>Prometheus</button>
          <button type="button" className="fci-pill-loki"       onClick={() => window.open('https://loki.example.com', '_blank')}>Loki</button>
          <button type="button" className="fci-pill-chaos"      onClick={() => window.open('https://chaos.example.com', '_blank')}>Chaos Demo</button>
          <button type="button" className="fci-pill-arch"       onClick={() => window.open('https://architecture.example.com', '_blank')}>Architecture</button>
        </div>
        <ThemeSwitcher />
      </div>
      </div>

      {/* ── VM confirmation modals ─────────────────────────────────────────── */}
      <DashboardModal
        isOpen={modalAction !== null}
        onClose={() => setModalAction(null)}
        title={modalTitle}
      >
        {modalAction === 'delete' && selectedVm && (
          <>
            <p className="fci-modal-message">Delete VM <strong style={{ color: 'var(--dash-label)' }}>{selectedVm.name}</strong>?</p>
            <p className="fci-modal-sub">This action cannot be undone.</p>
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={() => setModalAction(null)} disabled={modalIsPending}>
                Cancel
              </button>
              <button type="button" className="fci-modal-btn fci-modal-btn-danger" onClick={confirmModalAction} disabled={modalIsPending}>
                {modalIsPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </>
        )}
        {modalAction === 'stop' && selectedVm && (
          <>
            <p className="fci-modal-message">Stop VM <strong style={{ color: 'var(--dash-label)' }}>{selectedVm.name}</strong>?</p>
            <p className="fci-modal-sub">The VM will be gracefully shut down.</p>
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={() => setModalAction(null)} disabled={modalIsPending}>
                Cancel
              </button>
              <button type="button" className="fci-modal-btn" onClick={confirmModalAction} disabled={modalIsPending}>
                {modalIsPending ? 'Stopping…' : 'Stop VM'}
              </button>
            </div>
          </>
        )}
        {modalAction === 'reboot' && selectedVm && (
          <>
            <p className="fci-modal-message">Reboot VM <strong style={{ color: 'var(--dash-label)' }}>{selectedVm.name}</strong>?</p>
            <p className="fci-modal-sub">The VM will restart. It will briefly enter a pending state.</p>
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={() => setModalAction(null)} disabled={modalIsPending}>
                Cancel
              </button>
              <button type="button" className="fci-modal-btn" onClick={confirmModalAction} disabled={modalIsPending}>
                {modalIsPending ? 'Rebooting…' : 'Reboot VM'}
              </button>
            </div>
          </>
        )}
      </DashboardModal>
    </div>
  )
}
