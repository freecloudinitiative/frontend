import { http, HttpResponse, delay } from 'msw'
import { createGetByIdHandler, createDeleteHandler, createSettingsPatchHandler, createListHandler, defaultJitter as jitter, errorBody } from './utils'
import {
  getComputeEngines,
  getComputeEngineById,
  createComputeEngine,
  deleteComputeEngine,
  updateComputeEngine,
  type ComputeEngine,
  type ComputeEngineStatus,
} from '@/mocks/data/computeEngines'
import type { UpdateComputeEngineInput } from '@/features/computeEngine/types'
import { COMPUTE_ENGINE_OS_OPTIONS } from '@/features/computeEngine/constants'
import { decodeStrict } from '@/mocks/lib/strictBody'

// compute-service/internal/api/types.go: UpdateComputeEngineInput
export const COMPUTE_ENGINE_UPDATE_KEYS = [
  'name',
  'status',
  'cpu',
  'memory',
  'disk',
  'os',
  'autoBackups',
] as const

const METRIC_RANGE_CONFIG: Record<string, { points: number; intervalMs: number }> = {
  '30m': { points: 30, intervalMs: 60_000 },
  '1h': { points: 30, intervalMs: 2 * 60_000 },
  '3h': { points: 36, intervalMs: 5 * 60_000 },
  '1w': { points: 42, intervalMs: 4 * 60 * 60_000 },
}

function generateMetricSeries(computeEngineId: string, range: string) {
  const rng = new Uint32Array(1)
  for (let i = 0; i < computeEngineId.length; i++) rng[0] ^= computeEngineId.charCodeAt(i)

  const { points, intervalMs } = METRIC_RANGE_CONFIG[range] ?? METRIC_RANGE_CONFIG['1h']
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(now - (points - 1 - i) * intervalMs).toISOString(),
    cpu: Math.round(20 + Math.random() * 60),
    memory: Math.round(30 + Math.random() * 50),
    disk: Math.round(10 + Math.random() * 40),
  }))
}

export const computeEngineHandlers = [
  createListHandler('*/api/compute-engines', getComputeEngines, { filterField: 'status' }),

  // GET /api/compute-engines/:id — single Compute Engine
  createGetByIdHandler('*/api/compute-engines/:id', getComputeEngineById, 'Compute Engine', jitter),

  // POST /api/compute-engines — create a new Compute Engine
  http.post('*/api/compute-engines', async ({ request }) => {
    await delay(jitter())

    let body: Partial<ComputeEngine> = {}
    try {
      body = (await request.json()) as Partial<ComputeEngine>
    } catch {
      // allow empty body — defaults in createComputeEngine handle it
    }

    if (
      body.os !== undefined &&
      (typeof body.os !== 'string' || !COMPUTE_ENGINE_OS_OPTIONS.includes(body.os as typeof COMPUTE_ENGINE_OS_OPTIONS[number]))
    ) {
      return HttpResponse.json(
        errorBody('invalid_input', 'Invalid operating system', {
          allowed_os: [...COMPUTE_ENGINE_OS_OPTIONS],
        }),
        { status: 400 },
      )
    }

    const computeEngine = createComputeEngine(body)
    return HttpResponse.json(computeEngine, { status: 201 })
  }),

  // DELETE /api/compute-engines/:id
  createDeleteHandler('*/api/compute-engines/:id', deleteComputeEngine, 'Compute Engine', jitter),

  // GET /api/compute-engines/:id/metrics?range=30m|1h|3h|1w — fake time series
  http.get('*/api/compute-engines/:id/metrics', async ({ params, request }) => {
    await delay(jitter())

    const computeEngine = getComputeEngineById(params.id as string)
    if (!computeEngine) {
      return HttpResponse.json(errorBody('resource_not_found', 'Compute Engine not found'), { status: 404 })
    }

    const url = new URL(request.url)
    const range = url.searchParams.get('range') ?? '1h'
    const series = generateMetricSeries(computeEngine.id, range)
    return HttpResponse.json(series)
  }),
  // PATCH /api/compute-engines/:id — partial update (e.g. status change)
  http.patch('*/api/compute-engines/:id', async ({ params, request }) => {
    await delay(jitter())

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      rawBody = {}
    }

    if (typeof rawBody !== 'object' || rawBody === null || Array.isArray(rawBody)) {
      return HttpResponse.json(errorBody('invalid_input', 'Invalid body'), { status: 400 })
    }

    const bodyObj = rawBody as Record<string, unknown>
    const decoded = decodeStrict<Record<string, unknown>>(bodyObj, COMPUTE_ENGINE_UPDATE_KEYS)
    if (!decoded.ok) {
      const message = decoded.unknown.map((key) => `json: unknown field "${key}"`).join('; ')
      return HttpResponse.json(errorBody('invalid_input', `invalid request body: ${message}`), { status: 400 })
    }

    const VALID_STATUSES = new Set(['running', 'stopped', 'pending'])
    if ('status' in bodyObj) {
      if (typeof bodyObj.status !== 'string' || !VALID_STATUSES.has(bodyObj.status)) {
        return HttpResponse.json(errorBody('invalid_input', 'Invalid status'), { status: 400 })
      }
    }

    if ('name' in bodyObj && typeof bodyObj.name !== 'string') {
      return HttpResponse.json(errorBody('invalid_input', 'Invalid name'), { status: 400 })
    }
    if ('os' in bodyObj && typeof bodyObj.os !== 'string') {
      return HttpResponse.json(errorBody('invalid_input', 'Invalid os'), { status: 400 })
    }
    if ('autoBackups' in bodyObj && typeof bodyObj.autoBackups !== 'boolean') {
      return HttpResponse.json(errorBody('invalid_input', 'Invalid autoBackups'), { status: 400 })
    }
    if ('cpu' in bodyObj && (typeof bodyObj.cpu !== 'number' || bodyObj.cpu <= 0)) {
      return HttpResponse.json(errorBody('invalid_input', 'Invalid cpu'), { status: 400 })
    }
    if ('memory' in bodyObj && (typeof bodyObj.memory !== 'number' || bodyObj.memory <= 0)) {
      return HttpResponse.json(errorBody('invalid_input', 'Invalid memory'), { status: 400 })
    }
    if ('disk' in bodyObj && (typeof bodyObj.disk !== 'number' || bodyObj.disk <= 0)) {
      return HttpResponse.json(errorBody('invalid_input', 'Invalid disk'), { status: 400 })
    }

    const validatedInput: UpdateComputeEngineInput = {}
    if ('name' in bodyObj) validatedInput.name = bodyObj.name as string
    if ('status' in bodyObj) validatedInput.status = bodyObj.status as ComputeEngineStatus
    if ('cpu' in bodyObj) validatedInput.cpu = bodyObj.cpu as number
    if ('memory' in bodyObj) validatedInput.memory = bodyObj.memory as number
    if ('disk' in bodyObj) validatedInput.disk = bodyObj.disk as number
    if ('os' in bodyObj) validatedInput.os = bodyObj.os as string
    if ('autoBackups' in bodyObj) validatedInput.autoBackups = bodyObj.autoBackups as boolean

    const updated = updateComputeEngine(params.id as string, validatedInput)
    if (!updated) {
      return HttpResponse.json(errorBody('resource_not_found', 'Compute Engine not found'), { status: 404 })
    }
    return HttpResponse.json(updated)
  }),

  // PATCH /api/compute-engines/:id/settings
  createSettingsPatchHandler(
    '*/api/compute-engines/:id/settings',
    getComputeEngineById,
    'Compute Engine',
    COMPUTE_ENGINE_UPDATE_KEYS,
    jitter,
    (id, settings) => updateComputeEngine(id, settings as UpdateComputeEngineInput),
  ),
]
