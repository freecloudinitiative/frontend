import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createVm, deleteVm, getVm, getVmMetrics, getVms, patchVm } from './api'
import type { CreateVmInput, MetricRange, UpdateVmInput } from './types'

export const vmKeys = {
  all: ['vms'] as const,
  detail: (id: string) => ['vms', id] as const,
  metrics: (id: string, range: MetricRange) => ['vms', id, 'metrics', range] as const,
}

export function useVms() {
  return useQuery({ queryKey: vmKeys.all, queryFn: getVms })
}

export function useVm(id: string | undefined) {
  return useQuery({
    queryKey: vmKeys.detail(id ?? ''),
    queryFn: () => getVm(id!),
    enabled: Boolean(id),
  })
}

export function useCreateVm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateVmInput) => createVm(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vmKeys.all })
    },
  })
}

export function useDeleteVm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vmKeys.all })
    },
  })
}

export function useUpdateVm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, partial }: { id: string; partial: UpdateVmInput }) =>
      patchVm(id, partial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vmKeys.all })
    },
  })
}

export function useVmMetrics(
  id: string | undefined,
  range: MetricRange = '1h',
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: vmKeys.metrics(id ?? '', range),
    queryFn: () => getVmMetrics(id!, range),
    enabled: Boolean(id),
    refetchInterval: options?.refetchInterval,
  })
}
