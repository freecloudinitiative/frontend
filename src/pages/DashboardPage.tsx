import { lazy, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from 'react-oidc-context'
import { isOidcConfigured } from '@/lib/oidc'
import {
  serviceIdToSlug,
  slugToServiceId,
  type ServiceId,
  type ServiceRow,
} from '@/lib/mockServiceData'
import { useThemeStore } from '@/store/themeStore'
import { useRegionStore } from '@/store/regionStore'
import { useVms } from '@/features/vm/hooks'
import type { Vm } from '@/features/vm/types'
import { useDatabases } from '@/features/database/hooks'
import type { Database } from '@/features/database/types'
import { useIamUsers, useIamUser } from '@/features/iam/hooks'
import type { IamUser } from '@/features/iam/types'
import { useBuckets } from '@/features/storage/hooks'
import type { Bucket } from '@/features/storage/types'
import { useNetworks } from '@/features/network/hooks'
import type { Network } from '@/features/network/types'
import { formatBytes } from '@/features/storage/format'
import {
  ROUTED_TABS,
  SERVICE_TABS,
  type RoutedTab,
} from '@/features/dashboard/constants'
import { DashboardModal } from '@/features/dashboard/DashboardModal'
import { DashboardModalBody } from '@/features/dashboard/DashboardModalBody'
import { DetailPanel } from '@/features/dashboard/DetailPanel'
import { TopBar, MobileSearchBar } from '@/features/dashboard/TopBar'
import { ServiceSearchGrid } from '@/features/dashboard/ServiceSearchGrid'
import { useDashboardModals } from '@/features/dashboard/useDashboardModals'
import {
  VmRowActions,
  DatabaseRowActions,
  IamRowActions,
  StorageRowActions,
  NetworkRowActions,
} from '@/features/dashboard/actions'
import { ToastContainer } from '@/features/dashboard/Toast'
import { DataTable } from '@/features/dashboard/DataTable'
import {
  getVmColumns,
  getDatabaseColumns,
  getIamColumns,
  getNetworkColumns,
  getStorageColumns,
} from '@/features/dashboard/columns'
import { useToastStore } from '@/store/toastStore'
import { useIsMobile, useIsCompact } from '@/hooks/useIsMobile'
import { CommandPalette } from '@/features/dashboard/CommandPalette'
import { useKeyboardShortcuts } from '@/features/dashboard/useKeyboardShortcuts'
import { useGlobalSearch } from '@/features/dashboard/useGlobalSearch'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import './tui-dashboard.css'

const VmCreateForm = lazy(() => import('@/features/vm/pages/VmCreateForm').then((m) => ({ default: m.VmCreateForm })))
const VmSettingsPage = lazy(() => import('@/features/vm/pages/VmSettingsPage').then((m) => ({ default: m.VmSettingsPage })))
const DatabaseCreateForm = lazy(() => import('@/features/database/pages/DatabaseCreateForm').then((m) => ({ default: m.DatabaseCreateForm })))
const DatabaseSettingsPage = lazy(() => import('@/features/database/pages/DatabaseSettingsPage').then((m) => ({ default: m.DatabaseSettingsPage })))
const IamCreateForm = lazy(() => import('@/features/iam/pages/IamCreateForm').then((m) => ({ default: m.IamCreateForm })))
const IamSettingsPage = lazy(() => import('@/features/iam/pages/IamSettingsPage').then((m) => ({ default: m.IamSettingsPage })))
const BucketCreateForm = lazy(() => import('@/features/storage/pages/BucketCreateForm').then((m) => ({ default: m.BucketCreateForm })))
const BucketSettingsPage = lazy(() => import('@/features/storage/pages/BucketSettingsPage').then((m) => ({ default: m.BucketSettingsPage })))
const NetworkCreateForm = lazy(() => import('@/features/network/pages/NetworkCreateForm').then((m) => ({ default: m.NetworkCreateForm })))
const NetworkSettingsPage = lazy(() => import('@/features/network/pages/NetworkSettingsPage').then((m) => ({ default: m.NetworkSettingsPage })))

export function DashboardPage() {
  const { serviceId: serviceSlug, tab: tabSlug } = useParams<{ serviceId: string; tab: string }>()
  const navigate = useNavigate()

  const activeService = slugToServiceId(serviceSlug)
  const activeTab: RoutedTab = ROUTED_TABS.includes(tabSlug as RoutedTab) ? (tabSlug as RoutedTab) : 'info'
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const isMobile = useIsMobile()
  const isCompact = useIsCompact()

  // ── Mobile detail-panel visibility ──────────────────────────────────────────
  // On mobile the detail panel is hidden by default and revealed when a row is selected.
  const [showDetail, setShowDetail] = useState(false)

  const [searchQuery, setSearchQuery] = useState<Record<ServiceId, string>>({
    VM: '',
    Database: '',
    IAM: '',
    Network: '',
    Storage: '',
    'Load Balancer': '',
    Kubernetes: '',
  })
  const [focusedService, setFocusedService] = useState<ServiceId | null>(null)
  const [topSearchQuery, setTopSearchQuery] = useState('')
  const [topSearchFocused, setTopSearchFocused] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [regionOpen, setRegionOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  // Palette query lifted here so useGlobalSearch can react to it
  const [paletteQuery, setPaletteQuery] = useState('')
  // Ref for the global search bar — focused by Ctrl+S
  const globalSearchRef = useRef<HTMLInputElement>(null)
  const selectedRegion = useRegionStore((state) => state.region)
  const setRegion = useRegionStore((state) => state.setRegion)

  // ── Toast store ────────────────────────────────────────────────────────────
  const addToast = useToastStore((state) => state.addToast)

  // ── Auth (undefined when running in pass-through/no-auth mode) ────────────
  const auth = useContext(AuthContext)

  const vmsQuery = useVms()
  const databasesQuery = useDatabases()
  const iamUsersQuery = useIamUsers()
  const iamUserDetailQuery = useIamUser(activeService === 'IAM' ? (selectedRowId ?? undefined) : undefined)
  const bucketsQuery = useBuckets()
  const networksQuery = useNetworks()

  // ── Global cross-service search ───────────────────────────────────────────
  const searchDatasets = {
    vms: vmsQuery.data ?? [],
    databases: databasesQuery.data ?? [],
    iamUsers: iamUsersQuery.data ?? [],
    buckets: bucketsQuery.data ?? [],
    networks: networksQuery.data ?? [],
  }
  const globalSearchResults = useGlobalSearch(searchDatasets, topSearchQuery)
  const paletteResourceResults = useGlobalSearch(searchDatasets, paletteQuery)

  // Navigate to service info tab and select the matching row
  function handleSelectGlobalResult(result: { id: string; serviceSlug: string }) {
    navigate(`/services/${result.serviceSlug}/info`)
    setSelectedRowId(result.id)
    setTopSearchFocused(false)
    setTopSearchQuery('')
    setPaletteQuery('')
    setCommandPaletteOpen(false)
  }

  function clearSelectionAndResetTab() {
    setSelectedRowId(null)
    setShowDetail(false)
    if (activeTab !== 'info') {
      navigate(`/services/${serviceSlug}/info`)
    }
  }

  const {
    modalAction,
    modalTitle,
    modalIsPending,
    noSelectionMsg,
    triggerNoSelectionMsg,
    iamEditRole,
    setIamEditRole,
    deleteError,
    setDeleteError,
    iamActionError,
    setIamActionError,
    copyState,
    copyConnectionString,
    openVmAction,
    openDbAction,
    openNetworkAction,
    openDeleteFlow,
    handleMenuAction,
    closeModal,
    confirmModalAction,
    setModalAction,
  } = useDashboardModals({
    activeService: activeService ?? 'VM',
    selectedRowId,
    selectedVm: activeService === 'VM' ? (vmsQuery.data ?? []).find((vm: Vm) => vm.id === selectedRowId) ?? null : null,
    selectedDatabase: activeService === 'Database' ? (databasesQuery.data ?? []).find((db: Database) => db.id === selectedRowId) ?? null : null,
    selectedIamUser: activeService === 'IAM' ? (iamUsersQuery.data ?? []).find((u: IamUser) => u.id === selectedRowId) ?? null : null,
    selectedBucket: activeService === 'Storage' ? (bucketsQuery.data ?? []).find((bucket: Bucket) => bucket.id === selectedRowId) ?? null : null,
    selectedNetwork: activeService === 'Network' ? (networksQuery.data ?? []).find((n: Network) => n.id === selectedRowId) ?? null : null,
    navigate,
    selectTab: (slug: RoutedTab) => navigate(`/services/${serviceSlug}/${slug}`),
    clearSelectionAndResetTab,
  })

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
    zone: vm.zone,
  }))

  // ── Database row transformation ───────────────────────────────────────────
  const databaseRows: ServiceRow[] = (databasesQuery.data ?? []).map((db: Database) => ({
    id: db.id,
    name: db.name,
    status: db.status.charAt(0).toUpperCase() + db.status.slice(1),
    col3: db.engine,
    col4: `${db.host}:${db.port}`,
    col5: `${db.memory} GB`,
    col6: `${db.storageSize} GB`,
    region: db.region,
    zone: db.zone,
  }))

  // ── IAM row transformation ────────────────────────────────────────────────
  const iamRows: ServiceRow[] = (iamUsersQuery.data ?? []).map((user: IamUser) => ({
    id: user.id,
    name: user.name,
    status: user.status.charAt(0).toUpperCase() + user.status.slice(1),
    col3: user.role,
    col4: new Date(user.lastLogin).toLocaleDateString(),
    col5: user.mfaEnabled ? 'Enabled' : 'Disabled',
    col6: '',
    region: user.region,
    zone: user.zone,
  }))

  // ── Storage row transformation ────────────────────────────────────────────
  const bucketRows: ServiceRow[] = (bucketsQuery.data ?? []).map((bucket: Bucket) => ({
    id: bucket.id,
    name: bucket.bucketName,
    status: bucket.status.charAt(0).toUpperCase() + bucket.status.slice(1),
    col3: bucket.access.charAt(0).toUpperCase() + bucket.access.slice(1),
    col4: formatBytes(bucket.totalSize),
    col5: `${bucket.objectCount} objects`,
    col6: '',
    region: bucket.region,
    zone: bucket.zone,
  }))

  // ── Network row transformation ────────────────────────────────────────────
  const networkRows: ServiceRow[] = (networksQuery.data ?? []).map((n: Network) => ({
    id: n.id,
    name: n.vpcName,
    status: n.status.charAt(0).toUpperCase() + n.status.slice(1),
    col3: n.type,
    col4: n.cidrBlock,
    col5: n.gateway,
    col6: '',
    region: n.region,
    zone: n.zone,
  }))

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.fci-servicebox') && !target.closest('.fci-dropdown') && !target.closest('.fci-region-selector')) {
        setFocusedService(null)
        setProfileOpen(false)
        setRegionOpen(false)
      }

      const isNavOrInteractive =
        target.closest('.fci-table') ||
        target.closest('.fci-detail-panel') ||
        target.closest('.fci-modal-overlay') ||
        target.closest('.fci-box-keys-top') ||
        target.closest('.fci-theme-switcher') ||
        target.closest('.fci-footer-links') ||
        target.closest('.fci-topbar') ||
        target.closest('.fci-topgrid') ||
        target.closest('.fci-servicebox') ||
        target.closest('.fci-linkgrid') ||
        target.closest('.fci-search-dropdown') ||
        target.closest('.fci-dropdown') ||
        target.closest('.fci-region-selector') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('select')

      if (!isNavOrInteractive) {
        clearSelectionAndResetTab()
      }
    }
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [activeTab, navigate, serviceSlug])

  // For VM/Database/IAM, use live MSW data; for all other services use static dataset rows
  const activeRows: ServiceRow[] =
    activeService === 'VM'       ? vmRows
    : activeService === 'Database' ? databaseRows
    : activeService === 'IAM'      ? iamRows
    : activeService === 'Storage'   ? bucketRows
    : activeService === 'Network'   ? networkRows
    : []

  // ── Global region filter ──────────────────────────────────────────────────
  const filteredRows: ServiceRow[] =
    selectedRegion === 'ALL'
      ? activeRows
      : activeRows.filter((r) => r.region === selectedRegion)

  // Deselect when region changes and the selected row is no longer visible
  useEffect(() => {
    if (selectedRowId && !filteredRows.some((r) => r.id === selectedRowId)) {
      setSelectedRowId(null)
    }
  }, [selectedRegion, activeService])

  // Mobile viewport reset: switching active service tab automatically renders & focuses Instance List view
  useEffect(() => {
    if (isMobile) {
      setShowDetail(false)
      setSelectedRowId(null)
    }
  }, [activeService, isMobile])

  // ── Table column defs (must run unconditionally, before the early `return`s
  //     below, to satisfy rules-of-hooks) ─────────────────────────────────────
  const tableColumns = useMemo(() => {
    switch (activeService) {
      case 'VM': return getVmColumns()
      case 'Database': return getDatabaseColumns()
      case 'IAM': return getIamColumns()
      case 'Network': return getNetworkColumns()
      case 'Storage': return getStorageColumns()
      default: return []
    }
  }, [activeService])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  // Called unconditionally before any early return (rules of hooks).
  useKeyboardShortcuts({
    disabled: isMobile,
    commandPaletteOpen,
    openCommandPalette: () => setCommandPaletteOpen(true),
    closeCommandPalette: () => setCommandPaletteOpen(false),
    closeModal,
    closeDropdowns: () => {
      setProfileOpen(false)
      setRegionOpen(false)
      setFocusedService(null)
    },
    globalSearchRef,
    selectedRow: selectedRowId
      ? { id: selectedRowId, name: filteredRows.find((r) => r.id === selectedRowId)?.name ?? '' }
      : null,
    activeService,
    selectService,
    selectTab,
    openDeleteFlow,
    addToast,
    modalOpen: modalAction !== null,
  })

  if (!activeService) {
    return <Navigate to="/services/vm/info" replace />
  }

  const validTabsForService = SERVICE_TABS[activeService].map((t) => t.slug)
  const isCreateTab = activeTab === 'create' && (activeService === 'VM' || activeService === 'Database' || activeService === 'IAM' || activeService === 'Storage' || activeService === 'Network')
  const isSettingsTab = activeTab === 'settings'
  if (tabSlug && !isCreateTab && !isSettingsTab && !validTabsForService.includes(tabSlug as RoutedTab)) {
    return <Navigate to={`/services/${serviceSlug}/info`} replace />
  }

  const selectedRow = selectedRowId ? (filteredRows.find((row) => row.id === selectedRowId) ?? null) : null
  // Keep a reference to the full Vm object for the detail panel
  const selectedVm: Vm | null =
    activeService === 'VM' && selectedRow
      ? (vmsQuery.data ?? []).find((vm: Vm) => vm.id === selectedRow.id) ?? null
      : null
  // Keep a reference to the full Database object for the detail panel
  const selectedDatabase: Database | null =
    activeService === 'Database' && selectedRow
      ? (databasesQuery.data ?? []).find((db: Database) => db.id === selectedRow.id) ?? null
      : null
  // Keep a reference to the full IAM user for the detail panel
  const selectedIamUser: IamUser | null =
    activeService === 'IAM' && selectedRow
      ? (iamUsersQuery.data ?? []).find((u: IamUser) => u.id === selectedRow.id) ?? null
      : null
  const selectedIamUserWithPolicies = iamUserDetailQuery.data ?? null
  // Keep a reference to the full Bucket object for the detail panel
  const selectedBucket: Bucket | null =
    activeService === 'Storage' && selectedRow
      ? (bucketsQuery.data ?? []).find((bucket: Bucket) => bucket.id === selectedRow.id) ?? null
      : null
  // Keep a reference to the full Network object for the detail panel
  const selectedNetwork: Network | null =
    activeService === 'Network' && selectedRow
      ? (networksQuery.data ?? []).find((n: Network) => n.id === selectedRow.id) ?? null
      : null

  function selectService(id: ServiceId) {
    setSelectedRowId(null)
    if (isMobile) {
      setShowDetail(false)
    }
    navigate(`/services/${serviceIdToSlug(id)}/info`)
  }

  function selectTab(slug: RoutedTab) {
    navigate(`/services/${serviceSlug}/${slug}`)
  }

  function toggleProfile(event?: React.MouseEvent) {
    if (event) {
      event.stopPropagation()
    }
    setProfileOpen((prev) => !prev)
    setRegionOpen(false)
    setFocusedService(null)
  }

  function handleSignOut(event: React.MouseEvent) {
    event.stopPropagation()
    setProfileOpen(false)
    if (isOidcConfigured() && auth) {
      auth.signoutRedirect().catch(() => {
        addToast('Sign out failed', 'error')
      })
    } else {
      addToast('Auth not configured', 'info')
    }
  }

  function toggleRegion(event?: React.MouseEvent) {
    if (event) {
      event.stopPropagation()
    }
    setRegionOpen((prev) => !prev)
    setProfileOpen(false)
    setFocusedService(null)
  }

  function refetchActiveService() {
    if (activeService === 'VM') vmsQuery.refetch()
    else if (activeService === 'Database') databasesQuery.refetch()
    else if (activeService === 'IAM') iamUsersQuery.refetch()
    else if (activeService === 'Storage') bucketsQuery.refetch()
    else if (activeService === 'Network') networksQuery.refetch()
    else window.alert(`Refresh ${activeService} (demo)`)
  }

  // Services with a live-fetched (MSW) row source, vs. static dataset rows
  const isLiveService = activeService === 'VM' || activeService === 'Database' || activeService === 'IAM' || activeService === 'Storage' || activeService === 'Network'
  const liveIsLoading =
    activeService === 'VM'       ? vmsQuery.isLoading
    : activeService === 'Database' ? databasesQuery.isLoading
    : activeService === 'IAM'      ? iamUsersQuery.isLoading
    : activeService === 'Storage'   ? bucketsQuery.isLoading
    : activeService === 'Network'   ? networksQuery.isLoading
    : false
  const liveIsError =
    activeService === 'VM'       ? vmsQuery.isError
    : activeService === 'Database' ? databasesQuery.isError
    : activeService === 'IAM'      ? iamUsersQuery.isError
    : activeService === 'Storage'   ? bucketsQuery.isError
    : activeService === 'Network'   ? networksQuery.isError
    : false
  const liveError =
    activeService === 'VM'       ? vmsQuery.error
    : activeService === 'Database' ? databasesQuery.error
    : activeService === 'IAM'      ? iamUsersQuery.error
    : activeService === 'Storage'   ? bucketsQuery.error
    : activeService === 'Network'   ? networksQuery.error
    : null
  const liveErrorLabel =
    activeService === 'VM'       ? 'VM'
    : activeService === 'Database' ? 'database'
    : activeService === 'IAM'      ? 'IAM'
    : activeService === 'Storage'   ? 'bucket'
    : activeService === 'Network'   ? 'network'
    : ''

  return (
    <div className="fci-page" data-theme={theme}>
      <div className="fci-tui">
        <button
          type="button"
          className="fci-tui-title fci-tui-title-link"
          onClick={() => navigate('/dashboard')}
        >
          Free Cloud Initiative
        </button>

      <div className="fci-topbar">
        {/* ── Row 1 (mobile): Primary action controls ─────────────────────── */}
        {/* Order: Create (+) -> Connect (▶) -> Delete (✕) -> Refresh (↻) -> Setting (⚙) -> Region -> Profile */}
        {isMobile && (
          <TopBar
            activeService={activeService}
            navigate={navigate}
            onRefresh={refetchActiveService}
            openVmAction={openVmAction}
            openDbAction={openDbAction}
            openNetworkAction={openNetworkAction}
            setModalAction={setModalAction}
            selectedRowId={selectedRowId}
            selectedIamUser={selectedIamUser}
            selectedBucket={selectedBucket}
            setIamActionError={setIamActionError}
            setDeleteError={setDeleteError}
            triggerNoSelectionMsg={triggerNoSelectionMsg}
            theme={theme}
            setTheme={setTheme}
            selectedRegion={selectedRegion}
            setRegion={setRegion}
            regionOpen={regionOpen}
            toggleRegion={toggleRegion}
            setSelectedRowId={setSelectedRowId}
            setRegionOpen={setRegionOpen}
            profileOpen={profileOpen}
            setProfileOpen={setProfileOpen}
            toggleProfile={toggleProfile}
            handleSignOut={handleSignOut}
            isCompact={isCompact}
            isMobile={isMobile}
          />
        )}

        <ServiceSearchGrid
          activeService={activeService}
          isMobile={isMobile}
          isCompact={isCompact}
          navigate={navigate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          focusedService={focusedService}
          setFocusedService={setFocusedService}
          selectService={selectService}
          setSelectedRowId={setSelectedRowId}
          handleMenuAction={handleMenuAction}
          globalSearchRef={globalSearchRef}
          topSearchQuery={topSearchQuery}
          setTopSearchQuery={setTopSearchQuery}
          topSearchFocused={topSearchFocused}
          setTopSearchFocused={setTopSearchFocused}
          selectedRegion={selectedRegion}
          setRegion={setRegion}
          regionOpen={regionOpen}
          toggleRegion={toggleRegion}
          setRegionOpen={setRegionOpen}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          toggleProfile={toggleProfile}
          theme={theme}
          setTheme={setTheme}
          handleSignOut={handleSignOut}
          globalSearchResults={globalSearchResults}
          onSelectGlobalResult={handleSelectGlobalResult}
        />
      </div>

      <div className="fci-maingrid">
        {isCreateTab || isSettingsTab ? (
          <Suspense fallback={<div style={{ gridColumn: '1 / -1' }}><DashboardLoading /></div>}>
            {activeService === 'VM' && isCreateTab ? (
              <VmCreateForm
                onCancel={() => navigate('/services/vm/details')}
                onSuccess={() => navigate('/services/vm/details')}
              />
            ) : activeService === 'Database' && isCreateTab ? (
              <DatabaseCreateForm
                onCancel={() => navigate('/services/database/details')}
                onSuccess={() => navigate('/services/database/details')}
              />
            ) : activeService === 'IAM' && isCreateTab ? (
              <IamCreateForm
                onCancel={() => navigate('/services/iam/details')}
                onSuccess={() => navigate('/services/iam/details')}
              />
            ) : activeService === 'Storage' && isCreateTab ? (
              <BucketCreateForm
                onCancel={() => navigate('/services/storage/details')}
                onSuccess={() => navigate('/services/storage/details')}
              />
            ) : activeService === 'Network' && isCreateTab ? (
              <NetworkCreateForm
                onCancel={() => navigate('/services/network/details')}
                onSuccess={() => navigate('/services/network/details')}
              />
            ) : activeService === 'VM' && isSettingsTab ? (
              <VmSettingsPage onBack={() => navigate('/services/vm/info')} selectedRowId={selectedRowId} />
            ) : activeService === 'Database' && isSettingsTab ? (
              <DatabaseSettingsPage onBack={() => navigate('/services/database/info')} selectedRowId={selectedRowId} />
            ) : activeService === 'IAM' && isSettingsTab ? (
              <IamSettingsPage onBack={() => navigate('/services/iam/info')} selectedRowId={selectedRowId} />
            ) : activeService === 'Storage' && isSettingsTab ? (
              <BucketSettingsPage onBack={() => navigate('/services/storage/info')} selectedRowId={selectedRowId} />
            ) : activeService === 'Network' && isSettingsTab ? (
              <NetworkSettingsPage onBack={() => navigate('/services/network/info')} selectedRowId={selectedRowId} />
            ) : null}
          </Suspense>
        ) : (
          <>
        <div className={`fci-itemsbox${isMobile && showDetail ? ' fci-detail-hidden' : ''}`}>
          <div className="fci-box-label">{activeService}</div>
          <div className="fci-box-keys-top">
            <button
              id="btn-action-add"
              type="button"
              className="fci-linkbtn fci-topbtn-add"
              onClick={() =>
                activeService === 'VM'       ? navigate('/services/vm/create')
                : activeService === 'Database' ? navigate('/services/database/create')
                : activeService === 'IAM'      ? navigate('/services/iam/create')
                : activeService === 'Storage'   ? navigate('/services/storage/create')
                : activeService === 'Network'   ? navigate('/services/network/create')
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
              onClick={refetchActiveService}
              aria-label="Refresh"
              title="Refresh"
            >
              ↻
            </button>
            <button
              id="btn-action-settings"
              type="button"
              className="fci-linkbtn fci-topbtn-settings"
              onClick={() => navigate(`/services/${serviceIdToSlug(activeService)}/settings`)}
              aria-label="Settings"
              title="Settings"
            >
              ⚙
            </button>
            {/* Inline notice when no row is selected but an action was triggered */}
            {(activeService === 'VM' || activeService === 'Database' || activeService === 'IAM' || activeService === 'Storage' || activeService === 'Network') && noSelectionMsg && (
              <span className="fci-inline-notice">
                Select {activeService === 'VM' ? 'a VM' : activeService === 'Database' ? 'a database' : activeService === 'Storage' ? 'a bucket' : activeService === 'Network' ? 'a network' : 'a user'} first
              </span>
            )}
          </div>
          <div className="fci-itemslist" style={{ overflowX: 'auto' }}>
            <DataTable
              key={activeService}
              data={filteredRows}
              columns={tableColumns}
              onRowClick={(row) => {
                setSelectedRowId(row.id)
                if (isMobile) setShowDetail(true)
              }}
              selectedRowId={selectedRowId}
              isLoading={isLiveService && liveIsLoading}
              isError={isLiveService && liveIsError}
              errorMessage={liveError instanceof Error ? `${liveErrorLabel} — ${liveError.message}` : undefined}
              renderActions={(row) => {
                if (activeService === 'IAM') {
                  return (
                    <IamRowActions
                      row={row}
                      setSelectedRowId={setSelectedRowId}
                      setIamActionError={setIamActionError}
                      setModalAction={setModalAction}
                    />
                  )
                }
                if (activeService === 'VM') {
                  return (
                    <VmRowActions
                      row={row}
                      setSelectedRowId={setSelectedRowId}
                      setModalAction={setModalAction}
                    />
                  )
                }
                if (activeService === 'Database') {
                  return (
                    <DatabaseRowActions
                      row={row}
                      setSelectedRowId={setSelectedRowId}
                      setDeleteError={setDeleteError}
                      setModalAction={setModalAction}
                    />
                  )
                }
                if (activeService === 'Storage') {
                  return (
                    <StorageRowActions
                      row={row}
                      totalSize={(bucketsQuery.data ?? []).find((bucket: Bucket) => bucket.id === row.id)?.totalSize ?? 0}
                      setSelectedRowId={setSelectedRowId}
                      setDeleteError={setDeleteError}
                      setModalAction={setModalAction}
                    />
                  )
                }
                if (activeService === 'Network') {
                  return (
                    <NetworkRowActions
                      row={row}
                      setSelectedRowId={setSelectedRowId}
                      setDeleteError={setDeleteError}
                      setModalAction={setModalAction}
                    />
                  )
                }
                return null
              }}
            />
          </div>
        </div>

        <DetailPanel
          activeService={activeService}
          activeTab={activeTab}
          isMobile={isMobile}
          showDetail={showDetail}
          setShowDetail={setShowDetail}
          setSelectedRowId={setSelectedRowId}
          selectTab={selectTab}
          selectedRowId={selectedRowId}
          selectedRow={selectedRow}
          selectedVm={selectedVm}
          selectedDatabase={selectedDatabase}
          selectedIamUser={selectedIamUser}
          selectedIamUserWithPolicies={selectedIamUserWithPolicies}
          selectedBucket={selectedBucket}
          selectedNetwork={selectedNetwork}
          copyState={copyState}
          copyConnectionString={copyConnectionString}
        />
        </>
        )}
      </div>

      <MobileSearchBar
        activeService={activeService}
        navigate={navigate}
        setSelectedRowId={setSelectedRowId}
        handleMenuAction={handleMenuAction}
        topSearchFocused={topSearchFocused}
        setTopSearchFocused={setTopSearchFocused}
        topSearchQuery={topSearchQuery}
        setTopSearchQuery={setTopSearchQuery}
      />

      <div className="fci-footer">
        {/* ── Keyboard shortcut hints — desktop only (> 1450px via CSS) ──────── */}
        <div className="fci-footer-shortcuts">
          <span><b>/</b> search</span>
          <span><b>:vm</b> Virtual Machines</span>
          <span><b>:db</b> Database</span>
          <span><b>:iam</b> IAM</span>
          <span><b>:net</b> Network</span>
          <span><b>:str</b> Storage</span>
          <span><b>:lb</b> Load Balancer</span>
          <span><b>:k8s</b> Kubernetes</span>
        </div>
        <div className="fci-footer-links">
          <button type="button" className="fci-linkbtn fci-pill-creator" onClick={() => window.open('https://theomerkaratas.github.io/resume/', '_blank', 'noopener,noreferrer')}>About Creator</button>
          <button type="button" className="fci-linkbtn fci-pill-docs"       onClick={() => window.open('https://freecloudinitiative.github.io/docs/', '_blank', 'noopener,noreferrer')}>Docs</button>
          <button type="button" className="fci-linkbtn fci-pill-grafana"    onClick={() => window.open('https://grafana.example.com', '_blank', 'noopener,noreferrer')}>Grafana</button>
          <button type="button" className="fci-linkbtn fci-pill-prometheus" onClick={() => window.open('https://prometheus.example.com', '_blank', 'noopener,noreferrer')}>Prometheus</button>
          <button type="button" className="fci-linkbtn fci-pill-loki"       onClick={() => window.open('https://loki.example.com', '_blank', 'noopener,noreferrer')}>Loki</button>
          <button type="button" className="fci-linkbtn fci-pill-chaos"      onClick={() => window.open('https://chaos.example.com', '_blank', 'noopener,noreferrer')}>Chaos Demo</button>
          <button type="button" className="fci-linkbtn fci-pill-arch"       onClick={() => window.open('https://architecture.example.com', '_blank', 'noopener,noreferrer')}>Architecture</button>
        </div>
        <ThemeSwitcher />
      </div>
      </div>
      <ToastContainer />

      {/* ── Global Command Palette ────────────────────────────────────────────── */}
      <CommandPalette
        isOpen={!isMobile && commandPaletteOpen}
        onClose={() => { setCommandPaletteOpen(false); setPaletteQuery('') }}
        activeService={activeService}
        selectedRow={selectedRowId
          ? { id: selectedRowId, name: filteredRows.find((r) => r.id === selectedRowId)?.name ?? '' }
          : null
        }
        selectService={selectService}
        openDeleteFlow={openDeleteFlow}
        navigate={navigate}
        resourceResults={paletteResourceResults}
        onSelectResource={handleSelectGlobalResult}
        onQueryChange={setPaletteQuery}
      />

      {/* ── VM / Database confirmation modals ────────────────────────────────── */}
      <DashboardModal
        isOpen={modalAction !== null}
        onClose={closeModal}
        title={modalTitle}
      >
        <DashboardModalBody
          modalAction={modalAction}
          selectedVm={selectedVm}
          selectedDatabase={selectedDatabase}
          selectedIamUser={selectedIamUser}
          selectedBucket={selectedBucket}
          selectedNetwork={selectedNetwork}
          deleteError={deleteError}
          iamActionError={iamActionError}
          copyState={copyState}
          copyConnectionString={copyConnectionString}
          closeModal={closeModal}
          confirmModalAction={confirmModalAction}
          modalIsPending={modalIsPending}
          iamEditRole={iamEditRole}
          setIamEditRole={setIamEditRole}
        />
      </DashboardModal>
    </div>
  )
}
