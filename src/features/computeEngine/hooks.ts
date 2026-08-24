import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createResourceHooks, createResourceKeys } from '@/lib/queryFactory'
import {
  createComputeEngine,
  deleteComputeEngine,
  getComputeEngine,
  getComputeEngineMetrics,
  getComputeEngines,
  patchComputeEngine,
  updateComputeEngineSettings,
} from './api'
import type { CreateComputeEngineInput, MetricRange, UpdateComputeEngineInput } from './types'

export const computeEngineKeys = {
  ...createResourceKeys('compute-engines'),
  metrics: (id: string, range: MetricRange) => ['compute-engines', id, 'metrics', range] as const,
}

const resourceHooks = createResourceHooks<
  Awaited<ReturnType<typeof getComputeEngine>>,
  Awaited<ReturnType<typeof getComputeEngine>>,
  CreateComputeEngineInput
>({
  keys: computeEngineKeys,
  list: getComputeEngines,
  get: getComputeEngine,
  create: createComputeEngine,
  remove: deleteComputeEngine,
  updateSettings: updateComputeEngineSettings,
})

export const useComputeEngines = resourceHooks.useList
export const useComputeEngine = resourceHooks.useDetail
export const useCreateComputeEngine = resourceHooks.useCreate
export const useDeleteComputeEngine = resourceHooks.useRemove
export const useUpdateComputeEngineSettings = resourceHooks.useUpdateSettings

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
