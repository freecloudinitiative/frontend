import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createResourceHooks, createResourceKeys } from '@/lib/queryFactory'
import {
  createComputeEngine,
  deleteComputeEngine,
  getComputeEngineBackups,
  getComputeEngine,
  getComputeEngineMetrics,
  getComputeEngines,
  getInstanceTypes,
  patchComputeEngine,
  updateComputeEngineSettings,
} from './api'
import type { CreateComputeEngineInput, MetricRange, UpdateComputeEngineInput } from './types'

export const computeEngineKeys = {
  ...createResourceKeys('compute-engines'),
  metrics: (id: string, range: MetricRange) => ['compute-engines', id, 'metrics', range] as const,
  backups: (id: string) => ['compute-engines', id, 'backups'] as const,
  // Deliberately not under the 'compute-engines' prefix. Every create,
  // delete and settings update invalidates computeEngineKeys.all, and React
  // Query matches that prefix-first: a key of
  // ['compute-engines', 'instance-types'] would be invalidated with them.
  // Cluster capability has nothing to do with an account's list of
  // instances -- refetching it there wastes a request, and worse, it makes
  // a mutation's completion wait on that refetch.
  instanceTypes: ['compute-engine-instance-types'] as const,
}

const resourceHooks = createResourceHooks<
  Awaited<ReturnType<typeof getComputeEngine>>,
  Awaited<ReturnType<typeof getComputeEngine>>,
  CreateComputeEngineInput,
  UpdateComputeEngineInput
>({
  keys: computeEngineKeys,
  list: getComputeEngines,
  get: getComputeEngine,
  create: createComputeEngine,
  remove: deleteComputeEngine,
  updateSettings: updateComputeEngineSettings,
})

export function useComputeEngines() {
  return useQuery({
    queryKey: computeEngineKeys.all,
    queryFn: getComputeEngines,
    // Reconciliation is asynchronous. Poll only while an instance is still
    // genuinely progressing; a message means provisioning has stopped and
    // should be surfaced instead of polling forever.
    refetchInterval: (query) =>
      query.state.data?.some((engine) => engine.status === 'pending' && !engine.message) ? 2000 : false,
  })
}
export const useComputeEngine = resourceHooks.useDetail
export const useCreateComputeEngine = resourceHooks.useCreate
export const useDeleteComputeEngine = resourceHooks.useRemove
export const useUpdateComputeEngineSettings = resourceHooks.useUpdateSettings

/**
 * Cluster capability, not account data: it changes only when an operator
 * adds or removes a Kata node pool, and compute-service already caches the
 * answer for five minutes behind this endpoint. Long staleTime so opening
 * the create form repeatedly does not re-ask.
 */
export function useInstanceTypes() {
  return useQuery({
    queryKey: computeEngineKeys.instanceTypes,
    queryFn: getInstanceTypes,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateComputeEngine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, partial }: { id: string; partial: UpdateComputeEngineInput }) =>
      patchComputeEngine(id, partial),
    // Keep mutateAsync pending until active engine queries contain the updated
    // status. Reboot warning suppression relies on this synchronization point.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: computeEngineKeys.all }),
  })
}

export function useComputeEngineMetrics(
  id: string | undefined,
  range: MetricRange = '1h',
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: computeEngineKeys.metrics(id ?? '', range),
    queryFn: () => getComputeEngineMetrics(id!, range),
    enabled: Boolean(id),
    refetchInterval: options?.refetchInterval,
  })
}

export function useComputeEngineBackups(id: string | undefined) {
  return useQuery({
    queryKey: computeEngineKeys.backups(id ?? ''),
    queryFn: () => getComputeEngineBackups(id!),
    enabled: Boolean(id),
  })
}
