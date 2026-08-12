import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  all: ['compute-engines'] as const,
  detail: (id: string) => ['compute-engines', id] as const,
  metrics: (id: string, range: MetricRange) => ['compute-engines', id, 'metrics', range] as const,
}

export function useComputeEngines() {
  return useQuery({ queryKey: computeEngineKeys.all, queryFn: getComputeEngines })
}

export function useComputeEngine(id: string | undefined) {
  return useQuery({
    queryKey: computeEngineKeys.detail(id ?? ''),
    queryFn: () => getComputeEngine(id!),
    enabled: Boolean(id),
  })
}

export function useCreateComputeEngine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateComputeEngineInput) => createComputeEngine(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: computeEngineKeys.all })
    },
  })
}

export function useDeleteComputeEngine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteComputeEngine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: computeEngineKeys.all })
    },
  })
}

export function useUpdateComputeEngine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, partial }: { id: string; partial: UpdateComputeEngineInput }) =>
      patchComputeEngine(id, partial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: computeEngineKeys.all })
    },
  })
}

export function useUpdateComputeEngineSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, settings }: { id: string; settings: Record<string, unknown> }) =>
      updateComputeEngineSettings(id, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: computeEngineKeys.all })
    },
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
