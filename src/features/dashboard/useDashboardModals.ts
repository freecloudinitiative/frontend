import { useEffect, useRef, useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { ServiceId } from '@/lib/mockServiceData'
import { useDatabaseStore } from '@/features/database/store'
import { useIamStore } from '@/features/iam/store'
import type { Vm } from '@/features/vm/types'
import { useDeleteVm, useUpdateVm } from '@/features/vm/hooks'
import type { Database } from '@/features/database/types'
import { useDeleteDatabase } from '@/features/database/hooks'
import type { IamUser, IamUserRole } from '@/features/iam/types'
import { useUpdateIamUser, useDeleteIamUser } from '@/features/iam/hooks'
import type { Bucket } from '@/features/storage/types'
import { useDeleteBucket } from '@/features/storage/hooks'
import type { Network } from '@/features/network/types'
import { useDeleteNetwork } from '@/features/network/hooks'
import { useToastStore } from '@/store/toastStore'
import type { RoutedTab } from '@/features/dashboard/constants'
import { type ModalAction } from '@/features/dashboard/constants'

interface UseDashboardModalsParams {
  activeService: ServiceId
  selectedRowId: string | null
  selectedVm: Vm | null
  selectedDatabase: Database | null
  selectedIamUser: IamUser | null
  selectedBucket: Bucket | null
  selectedNetwork: Network | null
  navigate: NavigateFunction
  selectTab: (slug: RoutedTab) => void
  clearSelectionAndResetTab: () => void
}

export function useDashboardModals({
  activeService,
  selectedRowId,
  selectedVm,
  selectedDatabase,
  selectedIamUser,
  selectedBucket,
  selectedNetwork,
  navigate,
  selectTab,
  clearSelectionAndResetTab,
}: UseDashboardModalsParams) {
  const addToast = useToastStore((state) => state.addToast)

  const deleteError = useDatabaseStore((state) => state.deleteError)
  const setDeleteError = useDatabaseStore((state) => state.setDeleteError)
  const iamActionError = useIamStore((state) => state.actionError)
  const setIamActionError = useIamStore((state) => state.setActionError)
  const copyState = useDatabaseStore((state) => state.copyState)
  const setCopyState = useDatabaseStore((state) => state.setCopyState)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [noSelectionMsg, setNoSelectionMsg] = useState(false)
  const [iamEditRole, setIamEditRole] = useState<IamUserRole>('viewer')
  const noSelectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rebootTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isActionInFlightRef = useRef(false)

  const deleteVmMutation = useDeleteVm()
  const updateVmMutation = useUpdateVm()
  const deleteDatabaseMutation = useDeleteDatabase()
  const updateIamUserMutation = useUpdateIamUser()
  const deleteIamUserMutation = useDeleteIamUser()
  const deleteBucketMutation = useDeleteBucket()
  const deleteNetworkMutation = useDeleteNetwork()

  useEffect(() => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    setCopyState('copy')
  }, [selectedRowId, setCopyState])

  useEffect(() => {
    return () => {
      if (rebootTimerRef.current) clearTimeout(rebootTimerRef.current)
      if (noSelectionTimer.current) clearTimeout(noSelectionTimer.current)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  function clearRebootTimer() {
    if (rebootTimerRef.current) {
      clearTimeout(rebootTimerRef.current)
      rebootTimerRef.current = null
    }
  }

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

  function triggerNoSelectionMsg() {
    setNoSelectionMsg(true)
    if (noSelectionTimer.current) clearTimeout(noSelectionTimer.current)
    noSelectionTimer.current = setTimeout(() => setNoSelectionMsg(false), 2500)
  }

  // ── VM action helpers ──────────────────────────────────────────────────────
  function openVmAction(action: ModalAction) {
    if (!selectedRowId || !selectedVm) {
      // No explicit row selected — show brief inline notice
      triggerNoSelectionMsg()
      return
    }
    setModalAction(action)
  }

  function closeModal() {
    setModalAction(null)
    setDeleteError(null)
    setIamActionError(null)
  }

  // ── Keyboard-shortcut delete flow (service-aware) ──────────────────────────
  function openDeleteFlow() {
    if (!selectedRowId) return
    if (activeService === 'VM')       { openVmAction('delete'); return }
    if (activeService === 'Database') { openDbAction('db-delete'); return }
    if (activeService === 'IAM')      {
      if (selectedIamUser) {
        setIamActionError(null)
        setModalAction('iam-delete')
      }
      return
    }
    if (activeService === 'Storage') {
      if (selectedBucket) {
        setDeleteError(null)
        setModalAction('storage-delete')
      }
      return
    }
    if (activeService === 'Network') { openNetworkAction('network-delete'); return }
  }

  // ── Database action helpers ────────────────────────────────────────────────
  function openDbAction(action: ModalAction) {
    if (!selectedRowId || !selectedDatabase) {
      triggerNoSelectionMsg()
      return
    }
    setDeleteError(null)
    setModalAction(action)
  }

  // ── Network action helpers ─────────────────────────────────────────────────
  function openNetworkAction(action: ModalAction) {
    if (!selectedRowId || !selectedNetwork) {
      triggerNoSelectionMsg()
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
          triggerNoSelectionMsg()
          return
        }
        setIamActionError(null)
        setIamEditRole(selectedIamUser.role)
        setModalAction('iam-edit-role')
        return
      }
      if (label === 'Revoke access') {
        if (!selectedRowId || !selectedIamUser) {
          triggerNoSelectionMsg()
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
          triggerNoSelectionMsg()
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
      addToast('Database deleted', 'success')
    } catch (error) {
      console.error('[confirmDbDelete]', error)
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete database')
      addToast('Operation failed', 'error')
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
      addToast('IAM user role updated', 'success')
    } catch (error) {
      console.error('[confirmIamEditRole]', error)
      setIamActionError(error instanceof Error ? error.message : 'Failed to update IAM user role')
      addToast('Operation failed', 'error')
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
      addToast('IAM user access revoked', 'info')
    } catch (error) {
      console.error('[confirmIamRevoke]', error)
      setIamActionError(error instanceof Error ? error.message : 'Failed to revoke IAM user access')
      addToast('Operation failed', 'error')
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
      addToast('IAM user deleted', 'success')
    } catch (error) {
      console.error('[confirmIamDelete]', error)
      setIamActionError(error instanceof Error ? error.message : 'Failed to delete IAM user')
      addToast('Operation failed', 'error')
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
      addToast('Bucket deleted', 'success')
    } catch (error) {
      console.error('[confirmStorageDelete]', error)
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete bucket')
      addToast('Operation failed', 'error')
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
      addToast('Network deleted', 'success')
    } catch (error) {
      console.error('[confirmNetworkDelete]', error)
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete network')
      addToast('Operation failed', 'error')
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
        addToast('VM deleted', 'success')
      } else if (modalAction === 'stop') {
        clearRebootTimer()
        await updateVmMutation.mutateAsync({ id, partial: { status: 'stopped' } })
        addToast('VM status updated', 'info')
      } else if (modalAction === 'reboot') {
        clearRebootTimer()
        await updateVmMutation.mutateAsync({ id, partial: { status: 'pending' } })
        addToast('VM status updated', 'info')
        rebootTimerRef.current = setTimeout(async () => {
          try {
            await updateVmMutation.mutateAsync({ id, partial: { status: 'running' } })
          } catch (rebootErr) {
            console.error('[vm reboot second step]', rebootErr)
          } finally {
            rebootTimerRef.current = null
          }
        }, 2000)
      }
      setModalAction(null)
    } catch (error) {
      console.error('[confirmModalAction VM]', error)
      addToast('Operation failed', 'error')
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

  return {
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
  }
}
