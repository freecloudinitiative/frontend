import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import { getVms, getVmById, createVm, deleteVm, type Vm } from '@/mocks/data/vms'

// Artificial delay range (ms) — makes loading states visible during development
const DELAY_MIN = 300
const DELAY_MAX = 600

function jitter() {
  return faker.number.int({ min: DELAY_MIN, max: DELAY_MAX })
}

function generateMetricSeries(vmId: string) {
  const rng = new Uint32Array(1)
  for (let i = 0; i < vmId.length; i++) rng[0] ^= vmId.charCodeAt(i)

  const now = Date.now()
  return Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(now - (23 - i) * 3_600_000).toISOString(),
    cpu: Math.round(20 + Math.random() * 60),
    memory: Math.round(30 + Math.random() * 50),
    disk: Math.round(10 + Math.random() * 40),
  }))
}

export const vmHandlers = [
  http.get('/api/vms', async ({ request }) => {
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
  http.get('/api/vms/:id', async ({ params }) => {
    await delay(jitter())

    const vm = getVmById(params.id as string)
    if (!vm) {
      return HttpResponse.json({ error: 'VM not found' }, { status: 404 })
    }
    return HttpResponse.json(vm)
  }),

  // POST /api/vms — create a new VM
  http.post('/api/vms', async ({ request }) => {
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
  http.delete('/api/vms/:id', async ({ params }) => {
    await delay(jitter())

    const deleted = deleteVm(params.id as string)
    if (!deleted) {
      return HttpResponse.json({ error: 'VM not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/vms/:id/metrics — fake 24-hour time series
  http.get('/api/vms/:id/metrics', async ({ params }) => {
    await delay(jitter())

    const vm = getVmById(params.id as string)
    if (!vm) {
      return HttpResponse.json({ error: 'VM not found' }, { status: 404 })
    }

    const series = generateMetricSeries(vm.id)
    return HttpResponse.json(series)
  }),
]
