import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import { getVms, getVmById, createVm, deleteVm, updateVm, type Vm, type VmStatus } from '@/mocks/data/vms'
import type { UpdateVmInput } from '@/features/vm/types'

// Artificial delay range (ms) — makes loading states visible during development
const DELAY_MIN = 300
const DELAY_MAX = 600

function jitter() {
  return faker.number.int({ min: DELAY_MIN, max: DELAY_MAX })
}

const METRIC_RANGE_CONFIG: Record<string, { points: number; intervalMs: number }> = {
  '30m': { points: 30, intervalMs: 60_000 },
  '1h': { points: 30, intervalMs: 2 * 60_000 },
  '3h': { points: 36, intervalMs: 5 * 60_000 },
  '1w': { points: 42, intervalMs: 4 * 60 * 60_000 },
}

function generateMetricSeries(vmId: string, range: string) {
  const rng = new Uint32Array(1)
  for (let i = 0; i < vmId.length; i++) rng[0] ^= vmId.charCodeAt(i)

  const { points, intervalMs } = METRIC_RANGE_CONFIG[range] ?? METRIC_RANGE_CONFIG['1h']
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(now - (points - 1 - i) * intervalMs).toISOString(),
    cpu: Math.round(20 + Math.random() * 60),
    memory: Math.round(30 + Math.random() * 50),
    disk: Math.round(10 + Math.random() * 40),
  }))
}

export const vmHandlers = [
  http.get('*/api/vms', async ({ request }) => {
    await delay(jitter())

    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status')

    let vms = getVms()
    if (statusFilter) {
      vms = vms.filter((vm) => vm.status === statusFilter)
    }

    return HttpResponse.json(vms)
  }),

  // GET /api/vms/:id — single VM
  http.get('*/api/vms/:id', async ({ params }) => {
    await delay(jitter())

    const vm = getVmById(params.id as string)
    if (!vm) {
      return HttpResponse.json({ error: 'VM not found' }, { status: 404 })
    }
    return HttpResponse.json(vm)
  }),

  // POST /api/vms — create a new VM
  http.post('*/api/vms', async ({ request }) => {
    await delay(jitter())

    let body: Partial<Vm> = {}
    try {
      body = (await request.json()) as Partial<Vm>
    } catch {
      // allow empty body — defaults in createVm handle it
    }

    const vm = createVm(body)
    return HttpResponse.json(vm, { status: 201 })
  }),

  // DELETE /api/vms/:id
  http.delete('*/api/vms/:id', async ({ params }) => {
    await delay(jitter())

    const deleted = deleteVm(params.id as string)
    if (!deleted) {
      return HttpResponse.json({ error: 'VM not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/vms/:id/metrics?range=30m|1h|3h|1w — fake time series
  http.get('*/api/vms/:id/metrics', async ({ params, request }) => {
    await delay(jitter())

    const vm = getVmById(params.id as string)
    if (!vm) {
      return HttpResponse.json({ error: 'VM not found' }, { status: 404 })
    }

    const url = new URL(request.url)
    const range = url.searchParams.get('range') ?? '1h'
    const series = generateMetricSeries(vm.id, range)
    return HttpResponse.json(series)
  }),
  // PATCH /api/vms/:id — partial update (e.g. status change)
  http.patch('*/api/vms/:id', async ({ params, request }) => {
    await delay(jitter())

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      rawBody = {}
    }

    if (typeof rawBody !== 'object' || rawBody === null || Array.isArray(rawBody)) {
      return HttpResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const allowedKeys = new Set(['name', 'status', 'cpu', 'memory', 'disk', 'os'])
    const bodyObj = rawBody as Record<string, unknown>
    for (const key of Object.keys(bodyObj)) {
      if (!allowedKeys.has(key)) {
        return HttpResponse.json({ error: `Unknown field: ${key}` }, { status: 400 })
      }
    }

    const VALID_STATUSES = new Set(['running', 'stopped', 'pending'])
    if ('status' in bodyObj) {
      if (typeof bodyObj.status !== 'string' || !VALID_STATUSES.has(bodyObj.status)) {
        return HttpResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
    }

    if ('name' in bodyObj && typeof bodyObj.name !== 'string') {
      return HttpResponse.json({ error: 'Invalid name' }, { status: 400 })
    }
    if ('os' in bodyObj && typeof bodyObj.os !== 'string') {
      return HttpResponse.json({ error: 'Invalid os' }, { status: 400 })
    }
    if ('cpu' in bodyObj && (typeof bodyObj.cpu !== 'number' || bodyObj.cpu <= 0)) {
      return HttpResponse.json({ error: 'Invalid cpu' }, { status: 400 })
    }
    if ('memory' in bodyObj && (typeof bodyObj.memory !== 'number' || bodyObj.memory <= 0)) {
      return HttpResponse.json({ error: 'Invalid memory' }, { status: 400 })
    }
    if ('disk' in bodyObj && (typeof bodyObj.disk !== 'number' || bodyObj.disk <= 0)) {
      return HttpResponse.json({ error: 'Invalid disk' }, { status: 400 })
    }

    const validatedInput: UpdateVmInput = {}
    if ('name' in bodyObj) validatedInput.name = bodyObj.name as string
    if ('status' in bodyObj) validatedInput.status = bodyObj.status as VmStatus
    if ('cpu' in bodyObj) validatedInput.cpu = bodyObj.cpu as number
    if ('memory' in bodyObj) validatedInput.memory = bodyObj.memory as number
    if ('disk' in bodyObj) validatedInput.disk = bodyObj.disk as number
    if ('os' in bodyObj) validatedInput.os = bodyObj.os as string

    const updated = updateVm(params.id as string, validatedInput)
    if (!updated) {
      return HttpResponse.json({ error: 'VM not found' }, { status: 404 })
    }
    return HttpResponse.json(updated)
  }),
]

