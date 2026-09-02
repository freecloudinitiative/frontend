import { createResourceApi } from '@/lib/apiResource'
import apiClient from '@/lib/axios'
import type {
  ComputeEngine,
  ComputeEngineBackup,
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

function isComputeEngineBackup(value: unknown): value is ComputeEngineBackup {
  if (!value || typeof value !== 'object') return false
  const backup = value as Record<string, unknown>
  return (
    typeof backup.id === 'string' &&
    typeof backup.computeEngineId === 'string' &&
    typeof backup.startedAt === 'string' &&
    ['pending', 'running', 'completed', 'failed', 'expired'].includes(String(backup.status)) &&
    (backup.sizeBytes === undefined || typeof backup.sizeBytes === 'number')
  )
}

export async function getComputeEngineBackups(id: string): Promise<ComputeEngineBackup[]> {
  const { data } = await apiClient.get<unknown>(`/api/compute-engines/${id}/backups`)
  const payload = data && typeof data === 'object' && !Array.isArray(data)
    ? (data as { backups?: unknown; data?: unknown }).backups ?? (data as { data?: unknown }).data
    : data

  if (!Array.isArray(payload) || !payload.every(isComputeEngineBackup)) {
    throw new TypeError('Compute Engine backups response must contain an array')
  }
  return payload
}

function isMetricPoint(value: unknown): value is ComputeEngineMetricPoint {
  if (!value || typeof value !== 'object') return false

  const point = value as Record<string, unknown>
  return (
    typeof point.timestamp === 'string' &&
    typeof point.cpu === 'number' &&
    Number.isFinite(point.cpu) &&
    typeof point.memory === 'number' &&
    Number.isFinite(point.memory) &&
    typeof point.disk === 'number' &&
    Number.isFinite(point.disk)
  )
}

function isMetricPointArray(value: unknown): value is ComputeEngineMetricPoint[] {
  return Array.isArray(value) && value.every(isMetricPoint)
}

function extractMetricPoints(payload: unknown): ComputeEngineMetricPoint[] {
  if (isMetricPointArray(payload)) return payload

  if (payload && typeof payload === 'object') {
    const envelope = payload as { data?: unknown; metrics?: unknown }
    if (isMetricPointArray(envelope.metrics)) return envelope.metrics
    if (isMetricPointArray(envelope.data)) return envelope.data
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
