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
import { useRegionStore } from '@/store/regionStore'
import type { RegionFilter } from '@/store/regionStore'
import { useDatabaseStore } from '@/features/database/store'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { useVms, useDeleteVm, useUpdateVm, useVmMetrics } from '@/features/vm/hooks'
import type { Vm } from '@/features/vm/types'
import { VmCreateForm } from '@/features/vm/pages/VmCreateForm'
import { VmSettingsPage } from '@/features/vm/pages/VmSettingsPage'
import { useDatabases, useDeleteDatabase, useDatabaseMetrics } from '@/features/database/hooks'
import type { Database } from '@/features/database/types'
import { DatabaseCreateForm } from '@/features/database/pages/DatabaseCreateForm'
import { useIamUsers, useIamUser, useUpdateIamUser, useDeleteIamUser } from '@/features/iam/hooks'
import { useIamStore } from '@/features/iam/store'
import type { IamUser, IamUserRole } from '@/features/iam/types'
import { IamCreateForm } from '@/features/iam/pages/IamCreateForm'
import { useBuckets, useDeleteBucket } from '@/features/storage/hooks'
import type { Bucket } from '@/features/storage/types'
import { formatBytes } from '@/features/storage/format'
import { BucketCreateForm } from '@/features/storage/pages/BucketCreateForm'
import { useNetworks, useDeleteNetwork } from '@/features/network/hooks'
import type { Network } from '@/features/network/types'
import { NetworkCreateForm } from '@/features/network/pages/NetworkCreateForm'
import { TerminalSelect } from '@/components/TerminalSelect'
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
function TabContent({
  tab,
  service,
  selectedVmId,
  vmName,
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
  selectedVmId: string | null
  vmName?: string
  selectedDatabaseId?: string | null
  databaseName?: string
  maxConnections?: number
  iamUserWithPolicies?: import('@/features/iam/types').IamUserWithPolicies | null
  selectedBucketId?: string | null
  bucketName?: string
  selectedNetwork?: Network | null
}) {
  switch (service) {
    case 'VM':       return <VmTabContent tab={tab} selectedVmId={selectedVmId} vmName={vmName} />
    case 'Database': return <DatabaseTabContent tab={tab} selectedDatabaseId={selectedDatabaseId ?? null} databaseName={databaseName} maxConnections={maxConnections} />
    case 'IAM':      return <IamTabContent tab={tab} iamUserWithPolicies={iamUserWithPolicies} />
    case 'Network':  return <NetworkTabContent tab={tab} selectedNetwork={selectedNetwork ?? null} />
    case 'Storage':  return <StorageTabContent tab={tab} selectedBucketId={selectedBucketId ?? null} bucketName={bucketName} />
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

// ─── Database live usage bars ─────────────────────────────────────────────────
function DatabaseUsageCell({ databaseId }: { databaseId: string }) {
  const { data: metrics } = useDatabaseMetrics(databaseId, { refetchInterval: 5000 })
  const latest = metrics?.[metrics.length - 1]

  return (
    <div className="fci-usage-cell">
      <AsciiProgressBar label="C" value={latest?.cpuUsage ?? 0} width={10} />
      <AsciiProgressBar label="M" value={latest?.memoryUsage ?? 0} width={10} />
    </div>
  )
}

// ─── Storage usage bar (occupancy rate vs. 1 TB, same scale as the Metrics tab) ─
const STORAGE_MAX_BYTES = 1024 ** 4

function BucketUsageCell({ totalSize }: { totalSize: number }) {
  const usagePct = Math.min(100, Math.round((totalSize / STORAGE_MAX_BYTES) * 100))

  return (
    <div className="fci-usage-cell">
      <AsciiProgressBar label="S" value={usagePct} width={10} />
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
type ModalAction =
  | 'stop' | 'reboot' | 'delete'
  | 'db-connect' | 'db-backup' | 'db-restore' | 'db-delete'
  | 'iam-edit-role' | 'iam-revoke' | 'iam-delete'
  | 'storage-delete' | 'storage-upload' | 'storage-policy'
  | 'network-delete' | 'network-vpn'
  | null

export function DashboardPage() {
  const { serviceId: serviceSlug, tab: tabSlug } = useParams<{ serviceId: string; tab: string }>()
  const navigate = useNavigate()

  const activeService = slugToServiceId(serviceSlug)
  const activeTab: RoutedTab = ROUTED_TABS.includes(tabSlug as RoutedTab) ? (tabSlug as RoutedTab) : 'info'
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
  const [regionOpen, setRegionOpen] = useState(false)
  const selectedRegion = useRegionStore((state) => state.region)
  const setRegion = useRegionStore((state) => state.setRegion)

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [noSelectionMsg, setNoSelectionMsg] = useState(false)
  const deleteError = useDatabaseStore((state) => state.deleteError)
  const setDeleteError = useDatabaseStore((state) => state.setDeleteError)
  const iamActionError = useIamStore((state) => state.actionError)
  const setIamActionError = useIamStore((state) => state.setActionError)
  const noSelectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rebootTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isActionInFlightRef = useRef(false)
  const copyState = useDatabaseStore((state) => state.copyState)
  const setCopyState = useDatabaseStore((state) => state.setCopyState)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── VM mutations ───────────────────────────────────────────────────────────
  const deleteVmMutation = useDeleteVm()
  const updateVmMutation = useUpdateVm()

  const vmsQuery = useVms()

  // ── Database mutations ─────────────────────────────────────────────────────
  const deleteDatabaseMutation = useDeleteDatabase()
  const databasesQuery = useDatabases()

  // ── IAM queries & mutations ────────────────────────────────────────────────
  const iamUsersQuery = useIamUsers()
  const updateIamUserMutation = useUpdateIamUser()
  const deleteIamUserMutation = useDeleteIamUser()
  const iamUserDetailQuery = useIamUser(activeService === 'IAM' ? (selectedRowId ?? undefined) : undefined)
  const [iamEditRole, setIamEditRole] = useState<IamUserRole>('viewer')

  // ── Storage queries & mutations ────────────────────────────────────────────
  const bucketsQuery = useBuckets()
  const deleteBucketMutation = useDeleteBucket()

  // ── Network queries & mutations ────────────────────────────────────────────
  const networksQuery = useNetworks()
  const deleteNetworkMutation = useDeleteNetwork()

  useEffect(() => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    setCopyState('copy')
  }, [selectedRowId, setCopyState])

  function copyConnectionString(text: string) {
    if (!navigator.clipboard) {
      setCopyState('failed')
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopyState('copy'), 2000)
      return
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopyState('copied')
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopyState('copy'), 2000)
    }).catch(() => {
      setCopyState('failed')
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopyState('copy'), 2000)
    })
  }

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
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
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

  function clearSelectionAndResetTab() {
    setSelectedRowId(null)
    if (activeTab !== 'info') {
      navigate(`/services/${serviceSlug}/info`)
    }
  }

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

  // ── Sorting (depends on filteredRows, so placed after it; must run unconditionally,
  //     before the early `return`s below, to satisfy rules-of-hooks) ────────────
  const { sortedRows, sortState, toggleSort } = useSortableRows(filteredRows, activeService)


  if (!activeService) {
    return <Navigate to="/services/vm/info" replace />
  }

  const dataset = SERVICE_DATASETS[activeService]
  const validTabsForService = SERVICE_TABS[activeService].map((t) => t.slug)
  const isCreateTab = activeTab === 'create' && (activeService === 'VM' || activeService === 'Database' || activeService === 'IAM' || activeService === 'Storage' || activeService === 'Network')
  const isSettingsTab = activeTab === 'settings' && activeService === 'VM'
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
    navigate(`/services/${serviceIdToSlug(id)}/info`)
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

  function closeModal() {
    setModalAction(null)
    setDeleteError(null)
    setIamActionError(null)
  }

  // ── Database action helpers ────────────────────────────────────────────────
  function openDbAction(action: ModalAction) {
    if (!selectedRowId || !selectedDatabase) {
      setNoSelectionMsg(true)
      if (noSelectionTimer.current) clearTimeout(noSelectionTimer.current)
      noSelectionTimer.current = setTimeout(() => setNoSelectionMsg(false), 2500)
      return
    }
    setDeleteError(null)
    setModalAction(action)
  }

  // ── Network action helpers ─────────────────────────────────────────────────
  function openNetworkAction(action: ModalAction) {
    if (!selectedRowId || !selectedNetwork) {
      setNoSelectionMsg(true)
      if (noSelectionTimer.current) clearTimeout(noSelectionTimer.current)
      noSelectionTimer.current = setTimeout(() => setNoSelectionMsg(false), 2500)
      return
    }
    setDeleteError(null)
    setModalAction(action)
  }

  function handleMenuAction(serviceId: ServiceId, label: string) {
    if (serviceId === 'VM') {
      if (label === 'Launch VM') { navigate('/services/vm/create'); return }
      if (label === 'Stop')   { openVmAction('stop');   return }
      if (label === 'Reboot') { openVmAction('reboot'); return }
      if (label === 'Delete') { openVmAction('delete'); return }
    }
    if (serviceId === 'Database') {
      if (label === 'Connect')     { openDbAction('db-connect'); return }
      if (label === 'Take backup') { openDbAction('db-backup');  return }
      if (label === 'Restore')     { openDbAction('db-restore'); return }
      if (label === 'Delete')      { openDbAction('db-delete');  return }
    }
    if (serviceId === 'IAM') {
      if (label === 'Add user') { navigate('/services/iam/create'); return }
      if (label === 'Edit role') {
        if (!selectedRowId || !selectedIamUser) {
          setNoSelectionMsg(true)
          if (noSelectionTimer.current) clearTimeout(noSelectionTimer.current)
          noSelectionTimer.current = setTimeout(() => setNoSelectionMsg(false), 2500)
          return
        }
        setIamActionError(null)
        setIamEditRole(selectedIamUser.role)
        setModalAction('iam-edit-role')
        return
      }
      if (label === 'Revoke access') {
        if (!selectedRowId || !selectedIamUser) {
          setNoSelectionMsg(true)
          if (noSelectionTimer.current) clearTimeout(noSelectionTimer.current)
          noSelectionTimer.current = setTimeout(() => setNoSelectionMsg(false), 2500)
          return
        }
        setIamActionError(null)
        setModalAction('iam-revoke')
        return
      }
    }
    if (serviceId === 'Storage') {
      if (label === 'Create bucket') { navigate('/services/storage/create'); return }
      if (label === 'Upload') { setModalAction('storage-upload'); return }
      if (label === 'Set policy') { setModalAction('storage-policy'); return }
      if (label === 'Delete') {
        if (!selectedRowId || !selectedBucket) {
          setNoSelectionMsg(true)
          if (noSelectionTimer.current) clearTimeout(noSelectionTimer.current)
          noSelectionTimer.current = setTimeout(() => setNoSelectionMsg(false), 2500)
          return
        }
        setDeleteError(null)
        setModalAction('storage-delete')
        return
      }
    }
    if (serviceId === 'Network') {
      if (label === 'Add subnet')    { navigate('/services/network/create'); return }
      if (label === 'Edit firewall') { selectTab('firewall'); return }
      if (label === 'Create VPN')    { setModalAction('network-vpn'); return }
      if (label === 'Delete')        { openNetworkAction('network-delete'); return }
    }
    window.alert(`${label} — ${serviceId} (demo)`)
  }

  async function confirmDbDelete() {
    if (!selectedDatabase || isActionInFlightRef.current) return
    isActionInFlightRef.current = true
    setDeleteError(null)
    try {
      await deleteDatabaseMutation.mutateAsync(selectedDatabase.id)
      clearSelectionAndResetTab()
      closeModal()
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete database')
    } finally {
      isActionInFlightRef.current = false
    }
  }

  async function confirmIamEditRole() {
    if (!selectedIamUser || isActionInFlightRef.current) return
    isActionInFlightRef.current = true
    setIamActionError(null)
    try {
      await updateIamUserMutation.mutateAsync({ id: selectedIamUser.id, partial: { role: iamEditRole } })
      closeModal()
    } catch (error) {
      setIamActionError(error instanceof Error ? error.message : 'Failed to update IAM user role')
    } finally {
      isActionInFlightRef.current = false
    }
  }

  async function confirmIamRevoke() {
    if (!selectedIamUser || isActionInFlightRef.current) return
    isActionInFlightRef.current = true
    setIamActionError(null)
    try {
      await updateIamUserMutation.mutateAsync({ id: selectedIamUser.id, partial: { status: 'disabled' } })
      closeModal()
    } catch (error) {
      setIamActionError(error instanceof Error ? error.message : 'Failed to revoke IAM user access')
    } finally {
      isActionInFlightRef.current = false
    }
  }

  async function confirmIamDelete() {
    if (!selectedIamUser || isActionInFlightRef.current) return
    isActionInFlightRef.current = true
    setIamActionError(null)
    try {
      await deleteIamUserMutation.mutateAsync(selectedIamUser.id)
      clearSelectionAndResetTab()
      closeModal()
    } catch (error) {
      setIamActionError(error instanceof Error ? error.message : 'Failed to delete IAM user')
    } finally {
      isActionInFlightRef.current = false
    }
  }

  async function confirmStorageDelete() {
    if (!selectedBucket || isActionInFlightRef.current) return
    isActionInFlightRef.current = true
    setDeleteError(null)
    try {
      await deleteBucketMutation.mutateAsync(selectedBucket.id)
      clearSelectionAndResetTab()
      closeModal()
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete bucket')
    } finally {
      isActionInFlightRef.current = false
    }
  }

  async function confirmNetworkDelete() {
    if (!selectedNetwork || isActionInFlightRef.current) return
    isActionInFlightRef.current = true
    setDeleteError(null)
    try {
      await deleteNetworkMutation.mutateAsync(selectedNetwork.id)
      clearSelectionAndResetTab()
      closeModal()
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete network')
    } finally {
      isActionInFlightRef.current = false
    }
  }

  async function confirmModalAction() {
    if (modalAction === 'network-delete') {
      await confirmNetworkDelete()
      return
    }
    if (modalAction === 'db-delete') {
      await confirmDbDelete()
      return
    }
    if (modalAction === 'storage-delete') {
      await confirmStorageDelete()
      return
    }
    if (modalAction === 'iam-edit-role') {
      await confirmIamEditRole()
      return
    }
    if (modalAction === 'iam-revoke') {
      await confirmIamRevoke()
      return
    }
    if (modalAction === 'iam-delete') {
      await confirmIamDelete()
      return
    }
    if (!selectedVm || !modalAction || isActionInFlightRef.current) return
    isActionInFlightRef.current = true
    const id = selectedVm.id

    try {
      if (modalAction === 'delete') {
        clearRebootTimer()
        await deleteVmMutation.mutateAsync(id)
        clearSelectionAndResetTab()
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
    modalAction === 'delete'        ? 'Confirm Delete'
    : modalAction === 'stop'        ? 'Confirm Stop'
    : modalAction === 'reboot'      ? 'Confirm Reboot'
    : modalAction === 'db-delete'   ? 'Confirm Delete'
    : modalAction === 'db-connect'  ? `Connect to ${selectedDatabase?.name ?? 'database'}`
    : modalAction === 'db-backup'   ? 'Take Backup'
    : modalAction === 'db-restore'  ? 'Restore'
    : modalAction === 'iam-edit-role' ? `Edit Role — ${selectedIamUser?.name ?? 'user'}`
    : modalAction === 'iam-revoke'  ? 'Confirm Revoke Access'
    : modalAction === 'iam-delete'  ? 'Confirm Delete'
    : modalAction === 'storage-delete' ? 'Confirm Delete'
    : modalAction === 'storage-upload' ? 'Upload'
    : modalAction === 'storage-policy' ? 'Set Policy'
    : modalAction === 'network-delete' ? 'Confirm Delete'
    : modalAction === 'network-vpn'    ? 'Create VPN'
    : ''

  const modalIsPending =
    deleteVmMutation.isPending ||
    updateVmMutation.isPending ||
    deleteDatabaseMutation.isPending ||
    updateIamUserMutation.isPending ||
    deleteIamUserMutation.isPending ||
    deleteBucketMutation.isPending ||
    deleteNetworkMutation.isPending

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

        {/* ── Region Selector ────────────────────────────────────────────── */}
        <div
          className={`fci-box fci-region-selector fci-dropdown${regionOpen ? ' fci-open' : ''}`}
          role="button"
          tabIndex={0}
          id="btn-region-selector"
          onClick={(e) => {
            e.stopPropagation()
            setRegionOpen((prev) => !prev)
          }}
        >
          <div className="fci-box-label">Region</div>
          <span className="fci-region-icon">⊕</span>
          <span className="fci-region-name">{selectedRegion === 'ALL' ? 'All' : selectedRegion}</span>
          <div className="fci-dd-arrow">&#9660;</div>
          <div className="fci-dd-menu">
            {[
              { id: 'ALL' as RegionFilter, label: 'All', disabled: false },
              { id: 'IST' as RegionFilter, label: 'IST', disabled: false },
              { id: 'ANK' as RegionFilter, label: 'ANK', disabled: true },
            ].map(({ id: r, label, disabled }) => (
              <div
                key={r}
                className={`fci-dd-item${selectedRegion === r ? ' fci-dd-item-active' : ''}${disabled ? ' fci-dd-item-disabled' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (disabled) return
                  setRegion(r)
                  setSelectedRowId(null)
                  setRegionOpen(false)
                }}
              >
                {label}
              </div>
            ))}
          </div>
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
        {isCreateTab && activeService === 'VM' ? (
          <VmCreateForm
            onCancel={() => navigate('/services/vm/details')}
            onSuccess={() => navigate('/services/vm/details')}
          />
        ) : isCreateTab && activeService === 'Database' ? (
          <DatabaseCreateForm
            onCancel={() => navigate('/services/database/details')}
            onSuccess={() => navigate('/services/database/details')}
          />
        ) : isCreateTab && activeService === 'IAM' ? (
          <IamCreateForm
            onCancel={() => navigate('/services/iam/details')}
            onSuccess={() => navigate('/services/iam/details')}
          />
        ) : isCreateTab && activeService === 'Storage' ? (
          <BucketCreateForm
            onCancel={() => navigate('/services/storage/details')}
            onSuccess={() => navigate('/services/storage/details')}
          />
        ) : isCreateTab && activeService === 'Network' ? (
          <NetworkCreateForm
            onCancel={() => navigate('/services/network/details')}
            onSuccess={() => navigate('/services/network/details')}
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
              onClick={() =>
                activeService === 'VM'       ? vmsQuery.refetch()
                : activeService === 'Database' ? databasesQuery.refetch()
                : activeService === 'IAM'      ? iamUsersQuery.refetch()
                : activeService === 'Storage'   ? bucketsQuery.refetch()
                : activeService === 'Network'   ? networksQuery.refetch()
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
            {/* Inline notice when no row is selected but an action was triggered */}
            {(activeService === 'VM' || activeService === 'Database' || activeService === 'IAM' || activeService === 'Storage' || activeService === 'Network') && noSelectionMsg && (
              <span className="fci-inline-notice">
                Select {activeService === 'VM' ? 'a VM' : activeService === 'Database' ? 'a database' : activeService === 'Storage' ? 'a bucket' : activeService === 'Network' ? 'a network' : 'a user'} first
              </span>
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
                  {(activeService === 'VM' || activeService === 'Database' || activeService === 'IAM' || activeService === 'Storage' || activeService === 'Network') && <th style={{ width: '1%', whiteSpace: 'nowrap' }}></th>}
                </tr>
              </thead>
              <tbody>
                {/* VM/Database: loading state */}
                {isLiveService && liveIsLoading && (
                  <tr>
                    <td
                      colSpan={dataset.headers.length + 1}
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
                {/* VM/Database: error state */}
                {isLiveService && liveIsError && (
                  <tr>
                    <td
                      colSpan={dataset.headers.length + 1}
                      style={{
                        textAlign: 'center',
                        padding: '2.5rem 1rem',
                        color: '#e0546a',
                        letterSpacing: '0.08em',
                        fontSize: '0.85rem',
                      }}
                    >
                      ✗ Failed to load {liveErrorLabel} data — {liveError instanceof Error ? liveError.message : 'Unknown error'}
                    </td>
                  </tr>
                )}
                {/* All rows (live services after data loaded, or static-dataset services) */}
                {(!isLiveService || (!liveIsLoading && !liveIsError)) && (
                  activeRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={dataset.headers.length + 1}
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
                          <td className="fci-col-id" style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--dash-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.id.slice(0, 8)}</td>
                          <td style={{ color: isSelected ? 'var(--dash-row-selected-text)' : 'var(--dash-label)' }}>
                            {row.name}
                          </td>
                          <td style={{ color: 'var(--dash-text-dim)' }}>
                            {row.zone}
                          </td>
                          <td style={{ color: dataset.statusColors[row.status] ?? 'var(--dash-text)' }}>
                            {row.status}
                          </td>
                          <td style={{ color: dataset.col3Colors[row.col3] ?? 'var(--dash-text)' }}>{row.col3}</td>
                          <td>{row.col4}</td>
                          <td style={{ color: dataset.col5Colors?.[row.col5] ?? 'var(--dash-text-dim)' }}>{row.col5}</td>
                          {activeService !== 'IAM' && activeService !== 'Network' && activeService !== 'Storage' && (
                            <td style={{ color: 'var(--dash-text-dim)' }}>{row.col6}</td>
                          )}
                          {activeService === 'IAM' && (
                            <td
                              className="fci-td-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="fci-vm-actions">
                              {/* Delete */}
                              <button
                                type="button"
                                title="Delete user"
                                onClick={() => {
                                  setSelectedRowId(row.id)
                                  setIamActionError(null)
                                  setModalAction('iam-delete')
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
                                ✕
                              </button>
                              </div>
                            </td>
                          )}
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
                                &#x25BA;
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
                                ✕
                              </button>
                              </div>
                            </td>
                          )}
                          {activeService === 'Database' && (
                            <td
                              className="fci-td-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="fci-vm-actions">
                              {/* Live CPU/Memory usage */}
                              <DatabaseUsageCell databaseId={row.id} />
                              {/* Connect */}
                              <button
                                type="button"
                                title="Connect"
                                onClick={() => {
                                  setSelectedRowId(row.id)
                                  setDeleteError(null)
                                  setModalAction('db-connect')
                                }}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.45rem',
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
                                &#x25BA;
                              </button>
                              {/* Delete */}
                              <button
                                type="button"
                                title="Delete database"
                                onClick={() => {
                                  setSelectedRowId(row.id)
                                  setDeleteError(null)
                                  setModalAction('db-delete')
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
                                ✕
                              </button>
                              </div>
                            </td>
                          )}
                          {activeService === 'Storage' && (
                            <td
                              className="fci-td-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="fci-vm-actions">
                              {/* Live storage occupancy */}
                              <BucketUsageCell
                                totalSize={(bucketsQuery.data ?? []).find((bucket: Bucket) => bucket.id === row.id)?.totalSize ?? 0}
                              />
                              {/* Add File */}
                              <button
                                type="button"
                                title="Add file"
                                onClick={() => {
                                  setSelectedRowId(row.id)
                                  setModalAction('storage-upload')
                                }}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.45rem',
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
                                +
                              </button>
                              {/* Delete */}
                              <button
                                type="button"
                                title="Delete bucket"
                                onClick={() => {
                                  setSelectedRowId(row.id)
                                  setDeleteError(null)
                                  setModalAction('storage-delete')
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
                                ✕
                              </button>
                              </div>
                            </td>
                          )}
                          {activeService === 'Network' && (
                            <td
                              className="fci-td-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="fci-vm-actions">
                              {/* Delete */}
                              <button
                                type="button"
                                title="Delete network"
                                onClick={() => {
                                  setSelectedRowId(row.id)
                                  setDeleteError(null)
                                  setModalAction('network-delete')
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
                                ✕
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

          {activeTab === 'info' ? (
            // Info tab ─ always visible regardless of selection: service overview
            // documentation for VM/Database/IAM/Storage, generic fallback otherwise.
            <>
              {activeService === 'VM' ? (
                <div className="fci-tab-content">
                  <div className="fci-section-title">About VM Service</div>
                  <p>Provision and manage virtual machine instances across regions. Each VM is a dedicated compute resource with configurable CPU, memory, and disk.</p>
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
              {/* Details tab ─ VM/Database-specific Instance section + shared Metrics/Network/Security */}
              {activeTab === 'details' && selectedRow && (
                <>
                  {activeService === 'VM' && selectedVm && (
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
                        <table className="fci-table">
                          <thead>
                            <tr>
                              <th>Policy Name</th>
                              <th>Type</th>
                              <th>Attached At</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedIamUserWithPolicies.policies.map((policy) => (
                              <tr key={policy.id}>
                                <td style={{ color: 'var(--dash-label)' }}>{policy.name}</td>
                                <td>{policy.type === 'managed' ? 'Managed' : 'Custom'}</td>
                                <td style={{ color: 'var(--dash-text-dim)' }}>{new Date(policy.attachedAt).toLocaleDateString()}</td>
                                <td style={{ color: policy.status === 'active' ? '#7ec87e' : '#e8c07d' }}>
                                  {policy.status === 'active' ? 'Active' : 'Review needed'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                  selectedVmId={activeService === 'VM' ? selectedRowId : null}
                  vmName={activeService === 'VM' ? (selectedVm?.name ?? selectedRow?.name) : undefined}
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

      {/* ── VM / Database confirmation modals ────────────────────────────────── */}
      <DashboardModal
        isOpen={modalAction !== null}
        onClose={closeModal}
        title={modalTitle}
      >
        {modalAction === 'delete' && selectedVm && (
          <>
            <p className="fci-modal-message">Delete VM <strong style={{ color: 'var(--dash-label)' }}>{selectedVm.name}</strong>?</p>
            <p className="fci-modal-sub">This action cannot be undone.</p>
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
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
              <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
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
              <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
                Cancel
              </button>
              <button type="button" className="fci-modal-btn" onClick={confirmModalAction} disabled={modalIsPending}>
                {modalIsPending ? 'Rebooting…' : 'Reboot VM'}
              </button>
            </div>
          </>
        )}
        {modalAction === 'db-delete' && selectedDatabase && (
          <>
            <p className="fci-modal-message">Delete database <strong style={{ color: 'var(--dash-label)' }}>{selectedDatabase.name}</strong>?</p>
            <p className="fci-modal-sub">This action cannot be undone.</p>
            {deleteError && (
              <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
                ✗ {deleteError}
              </div>
            )}
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
                Cancel
              </button>
              <button type="button" className="fci-modal-btn fci-modal-btn-danger" onClick={confirmModalAction} disabled={modalIsPending}>
                {modalIsPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </>
        )}
        {modalAction === 'db-connect' && selectedDatabase && (
          <>
            <p className="fci-modal-message">Connection string for <strong style={{ color: 'var(--dash-label)' }}>{selectedDatabase.name}</strong>:</p>
            <p className="fci-modal-sub" style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--dash-text)' }}>
              {selectedDatabase.connectionString}
            </p>
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal}>
                Close
              </button>
              <button type="button" className="fci-modal-btn" onClick={() => copyConnectionString(selectedDatabase.connectionString)} style={{ color: copyState === 'failed' ? '#e0546a' : undefined }}>
                {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Failed' : 'Copy'}
              </button>
            </div>
          </>
        )}
        {modalAction === 'db-backup' && selectedDatabase && (
          <>
            <p className="fci-modal-message">Backup initiated for <strong style={{ color: 'var(--dash-label)' }}>{selectedDatabase.name}</strong>.</p>
            <p className="fci-modal-sub">This is a demo action — no real backup is taken.</p>
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </>
        )}
        {modalAction === 'db-restore' && selectedDatabase && (
          <>
            <p className="fci-modal-message">Restore is not available in demo mode.</p>
            <p className="fci-modal-sub">No changes were made to <strong style={{ color: 'var(--dash-label)' }}>{selectedDatabase.name}</strong>.</p>
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </>
        )}
        {modalAction === 'iam-edit-role' && selectedIamUser && (
          <>
            <p className="fci-modal-message">
              Change role for <strong style={{ color: 'var(--dash-label)' }}>{selectedIamUser.name}</strong>:
            </p>
            <div style={{ margin: '12px 0' }}>
              <TerminalSelect
                id="iam-modal-role"
                label="New Role"
                value={iamEditRole}
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'editor', label: 'Editor' },
                  { value: 'viewer', label: 'Viewer' },
                  { value: 'auditor', label: 'Auditor' },
                ]}
                onChange={(value) => setIamEditRole(value as IamUserRole)}
              />
            </div>
            {iamActionError && (
              <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
                ✗ {iamActionError}
              </div>
            )}
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
                Cancel
              </button>
              <button
                type="button"
                className="fci-modal-btn"
                onClick={confirmModalAction}
                disabled={modalIsPending}
              >
                {modalIsPending ? 'Updating…' : 'Update Role'}
              </button>
            </div>
          </>
        )}
        {modalAction === 'iam-revoke' && selectedIamUser && (
          <>
            <p className="fci-modal-message">
              Revoke access for <strong style={{ color: 'var(--dash-label)' }}>{selectedIamUser.name}</strong>?
            </p>
            <p className="fci-modal-sub">
              The user&apos;s status will be set to <strong>disabled</strong>. They will no longer be able to log in.
            </p>
            {iamActionError && (
              <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
                ✗ {iamActionError}
              </div>
            )}
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
                Cancel
              </button>
              <button
                type="button"
                className="fci-modal-btn fci-modal-btn-danger"
                onClick={confirmModalAction}
                disabled={modalIsPending}
              >
                {modalIsPending ? 'Revoking…' : 'Revoke Access'}
              </button>
            </div>
          </>
        )}
        {modalAction === 'iam-delete' && selectedIamUser && (
          <>
            <p className="fci-modal-message">Delete user <strong style={{ color: 'var(--dash-label)' }}>{selectedIamUser.name}</strong>?</p>
            <p className="fci-modal-sub">This action cannot be undone.</p>
            {iamActionError && (
              <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
                ✗ {iamActionError}
              </div>
            )}
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
                Cancel
              </button>
              <button type="button" className="fci-modal-btn fci-modal-btn-danger" onClick={confirmModalAction} disabled={modalIsPending}>
                {modalIsPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </>
        )}
        {modalAction === 'storage-delete' && selectedBucket && (
          <>
            <p className="fci-modal-message">Delete bucket <strong style={{ color: 'var(--dash-label)' }}>{selectedBucket.bucketName}</strong>?</p>
            <p className="fci-modal-sub">This action cannot be undone.</p>
            {deleteError && (
              <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
                ✗ {deleteError}
              </div>
            )}
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
                Cancel
              </button>
              <button type="button" className="fci-modal-btn fci-modal-btn-danger" onClick={confirmModalAction} disabled={modalIsPending}>
                {modalIsPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </>
        )}
        {modalAction === 'storage-upload' && (
          <>
            <p className="fci-modal-message">File upload is not available in demo mode.</p>
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </>
        )}
        {modalAction === 'storage-policy' && (
          <>
            <p className="fci-modal-message">Policy management coming soon.</p>
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </>
        )}
        {modalAction === 'network-delete' && selectedNetwork && (
          <>
            <p className="fci-modal-message">Delete network <strong style={{ color: 'var(--dash-label)' }}>{selectedNetwork.vpcName}</strong>?</p>
            <p className="fci-modal-sub">This action cannot be undone.</p>
            {deleteError && (
              <div style={{ color: '#e0546a', marginBottom: 14, fontSize: '0.85rem' }}>
                ✗ {deleteError}
              </div>
            )}
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal} disabled={modalIsPending}>
                Cancel
              </button>
              <button type="button" className="fci-modal-btn fci-modal-btn-danger" onClick={confirmModalAction} disabled={modalIsPending}>
                {modalIsPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </>
        )}
        {modalAction === 'network-vpn' && (
          <>
            <p className="fci-modal-message">VPN creation is not available in demo mode.</p>
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </>
        )}
      </DashboardModal>
    </div>
  )
}
