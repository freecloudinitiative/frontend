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

function extractMetricPoints(payload: unknown): ComputeEngineMetricPoint[] {
  if (Array.isArray(payload)) return payload as ComputeEngineMetricPoint[]

  if (payload && typeof payload === 'object') {
    const envelope = payload as { data?: unknown; metrics?: unknown }
    if (Array.isArray(envelope.metrics)) return envelope.metrics as ComputeEngineMetricPoint[]
    if (Array.isArray(envelope.data)) return envelope.data as ComputeEngineMetricPoint[]
  }

  throw new TypeError('Compute Engine metrics response must contain an array')
}

export async function getComputeEngineMetrics(
  id: string,
  range: MetricRange = '1h',
): Promise<ComputeEngineMetricPoint[]> {
  const { data } = await apiClient.get<unknown>(`/api/compute-engines/${id}/metrics`, {
    params: { range },
  })
  return extractMetricPoints(data)
}
