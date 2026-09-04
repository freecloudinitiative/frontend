import { useEffect } from 'react'
import { useToastStore } from '@/store/toastStore'
import { useComputeEngines } from '@/features/computeEngine/hooks'
import type { ComputeEngineStatus } from '@/features/computeEngine/types'

/**
 * Last status this browser tab observed for each instance, keyed by id.
 *
 * Module scope rather than component state on purpose. The transition worth
 * announcing is one the *poll* observed, and the poll belongs to a single
 * shared React Query entry that several mounted components read at once
 * (DashboardOverview and DashboardPage both call useComputeEngines). Per
 * component state would announce the same transition once per reader; one map
 * updated as the transition is recognised means whichever effect runs first
 * fires the toast and every later reader sees the new status already recorded.
 *
 * It is deliberately not persisted: a page reload starts with an empty map, so
 * an instance that was already running is not re-announced.
 */
const lastSeenStatus = new Map<string, ComputeEngineStatus>()

/** Test seam: drops the observed-status map so cases do not leak into each other. */
export function resetInstanceReadyTracking() {
  lastSeenStatus.clear()
}

/**
 * Announces each instance that finishes provisioning.
 *
 * Fires only on an observed pending -> running edge. An instance that is
 * already running the first time this tab sees it produces nothing, which is
 * what keeps a reload or a navigation from replaying old news; and a running
 * instance that is stopped and started again does toast, because the poll sees
 * it pass back through pending.
 *
 * Mount it anywhere the compute-engine list is already being polled -- it adds
 * no request of its own, and mounting it more than once is safe by the note on
 * `lastSeenStatus` above.
 */
export function useInstanceReadyToasts() {
  const { data: engines } = useComputeEngines()
  const addToast = useToastStore((state) => state.addToast)

  useEffect(() => {
    if (!engines) return

    for (const engine of engines) {
      const previous = lastSeenStatus.get(engine.id)
      lastSeenStatus.set(engine.id, engine.status)
      if (previous === 'pending' && engine.status === 'running') {
        addToast(`The instance ${engine.name} is now ready.`, 'success', 6000)
      }
    }

    // Forget instances that no longer exist, so a deleted-then-recreated id
    // cannot inherit a stale status and skip its own announcement.
    const live = new Set(engines.map((engine) => engine.id))
    for (const id of lastSeenStatus.keys()) {
      if (!live.has(id)) lastSeenStatus.delete(id)
    }
  }, [engines, addToast])
}
