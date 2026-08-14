import { createResourceApi } from '@/lib/apiResource'
import apiClient from '@/lib/axios'
import type {
  ComputeEngine,
  ComputeEngineMetricPoint,
  CreateComputeEngineInput,
  MetricRange,
  UpdateComputeEngineInput,
} from './types'

const resource = createResourceApi<ComputeEngine, CreateComputeEngineInput, UpdateComputeEngineInput>(
  '/api/compute-engines',
)

export const getComputeEngines = resource.list
export const getComputeEngine = resource.get
export const createComputeEngine = resource.create
export const deleteComputeEngine = resource.remove
export const patchComputeEngine = resource.patch
export const updateComputeEngineSettings = resource.updateSettings

export interface ConsoleSession {
  ticket: string
  expiresAt: string
}

export async function createComputeEngineConsoleSession(id: string): Promise<ConsoleSession> {
  const { data } = await apiClient.post<ConsoleSession>(`/api/compute-engines/${id}/console-sessions`)
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
