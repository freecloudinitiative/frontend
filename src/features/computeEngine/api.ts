import apiClient from '@/lib/axios'
import type {
  ComputeEngine,
  ComputeEngineMetricPoint,
  CreateComputeEngineInput,
  MetricRange,
  UpdateComputeEngineInput,
} from './types'

export async function getComputeEngines(): Promise<ComputeEngine[]> {
  const { data } = await apiClient.get<ComputeEngine[]>('/api/compute-engines')
  return data
}

export async function getComputeEngine(id: string): Promise<ComputeEngine> {
  const { data } = await apiClient.get<ComputeEngine>(`/api/compute-engines/${id}`)
  return data
}

export async function createComputeEngine(input: CreateComputeEngineInput): Promise<ComputeEngine> {
  const { data } = await apiClient.post<ComputeEngine>('/api/compute-engines', input)
  return data
}

export async function deleteComputeEngine(id: string): Promise<void> {
  await apiClient.delete(`/api/compute-engines/${id}`)
}

export async function patchComputeEngine(id: string, partial: UpdateComputeEngineInput): Promise<ComputeEngine> {
  const { data } = await apiClient.patch<ComputeEngine>(`/api/compute-engines/${id}`, partial)
  return data
}

export async function getComputeEngineMetrics(
  id: string,
  range: MetricRange = '1h',
): Promise<ComputeEngineMetricPoint[]> {
  const { data } = await apiClient.get<ComputeEngineMetricPoint[]>(`/api/compute-engines/${id}/metrics`, {
    params: { range },
  })
  return data
}

export async function updateComputeEngineSettings(
  id: string,
  settings: Record<string, unknown>,
): Promise<ComputeEngine> {
  const { data } = await apiClient.patch<ComputeEngine>(`/api/compute-engines/${id}/settings`, settings)
  return data
}
