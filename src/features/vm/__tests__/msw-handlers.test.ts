/**
 * VM MSW handler integration tests.
 * Covers all six endpoints: list, detail, create, delete, patch, metrics.
 * Validates UpdateVmInput immutable-field rejection and
 * MetricRange filtering.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'
import { getVms } from '@/mocks/data/vms'

const BASE = 'http://localhost'

async function get(path: string) {
  return fetch(`${BASE}${path}`)
}
async function post(path: string, body: unknown) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
async function patch(path: string, body: unknown) {
  return fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
async function del(path: string) {
  return fetch(`${BASE}${path}`, { method: 'DELETE' })
}

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// GET /api/vms
// ---------------------------------------------------------------------------

describe('GET /api/vms — list', () => {
  it('returns HTTP 200 with an array of VMs', async () => {
    const res = await get('/api/vms')
    expect(res.status).toBe(200)
    const data = await res.json() as unknown[]
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThanOrEqual(9)
  })

  it('each VM has all required fields', async () => {
    const res = await get('/api/vms')
    const data = await res.json() as Record<string, unknown>[]
    const vm = data[0]
    ;['id','name','status','cpu','memory','disk','diskType','ipAddress','os','region','createdAt']
      .forEach((f) => expect(f in vm).toBe(true))
  })

  it('supports ?status filter', async () => {
    const createRes = await post('/api/vms', { name: 'filter-stopped-vm' })
    const created = await createRes.json() as { id: string }
    await patch(`/api/vms/${created.id}`, { status: 'stopped' })

    const res = await get('/api/vms?status=stopped')
    expect(res.status).toBe(200)
    const data = await res.json() as { status: string }[]
    expect(data.length).toBeGreaterThan(0)
    data.forEach((vm) => expect(vm.status).toBe('stopped'))
  })
})

// ---------------------------------------------------------------------------
// GET /api/vms/:id
// ---------------------------------------------------------------------------

describe('GET /api/vms/:id — detail', () => {
  it('returns HTTP 200 with correct VM', async () => {
    const id = getVms()[0].id
    const res = await get(`/api/vms/${id}`)
    expect(res.status).toBe(200)
    const data = await res.json() as { id: string }
    expect(data.id).toBe(id)
  })

  it('returns HTTP 404 for unknown ID', async () => {
    const res = await get('/api/vms/no-such-vm')
    expect(res.status).toBe(404)
    const data = await res.json() as { error: string }
    expect(typeof data.error).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// POST /api/vms
// ---------------------------------------------------------------------------

describe('POST /api/vms — create', () => {
  it('creates VM and returns HTTP 201 with pending status', async () => {
    const res = await post('/api/vms', { name: 'new-vm-01', cpu: 2, memory: 4, disk: 50, os: 'Debian 12', region: 'ANK' })
    expect(res.status).toBe(201)
    const data = await res.json() as { status: string; id: string }
    expect(data.status).toBe('pending')
    expect(typeof data.id).toBe('string')
  })

  it('persists: created VM appears in list', async () => {
    const createRes = await post('/api/vms', { name: 'persist-vm-01' })
    const created = await createRes.json() as { id: string }
    const listRes = await get('/api/vms')
    const list = await listRes.json() as { id: string }[]
    expect(list.some((vm) => vm.id === created.id)).toBe(true)
  })

  it('accepts empty body (all defaults)', async () => {
    const res = await post('/api/vms', {})
    expect(res.status).toBe(201)
    const data = await res.json() as { id: string }
    expect(typeof data.id).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// DELETE /api/vms/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/vms/:id', () => {
  it('deletes VM and returns HTTP 204', async () => {
    const createRes = await post('/api/vms', { name: 'to-del-vm' })
    const created = await createRes.json() as { id: string }
    expect((await del(`/api/vms/${created.id}`)).status).toBe(204)
  })

  it('subsequent GET of deleted VM returns 404', async () => {
    const createRes = await post('/api/vms', { name: 'gone-vm' })
    const { id } = await createRes.json() as { id: string }
    await del(`/api/vms/${id}`)
    expect((await get(`/api/vms/${id}`)).status).toBe(404)
  })

  it('returns 404 for nonexistent ID', async () => {
    expect((await del('/api/vms/no-such-vm-del')).status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/vms/:id — UpdateVmInput immutability
// ---------------------------------------------------------------------------

describe('PATCH /api/vms/:id — mutable fields', () => {
  it('updates status and returns HTTP 200', async () => {
    const id = getVms()[0].id
    const res = await patch(`/api/vms/${id}`, { status: 'stopped' })
    expect(res.status).toBe(200)
    const data = await res.json() as { status: string }
    expect(data.status).toBe('stopped')
  })

  it('updates name and cpu', async () => {
    const id = getVms()[1].id
    const res = await patch(`/api/vms/${id}`, { name: 'renamed-vm', cpu: 8 })
    expect(res.status).toBe(200)
    const data = await res.json() as { name: string; cpu: number }
    expect(data.name).toBe('renamed-vm')
    expect(data.cpu).toBe(8)
  })

  it('PATCH persists: GET reflects new status', async () => {
    const id = getVms()[2].id
    await patch(`/api/vms/${id}`, { status: 'stopped' })
    const res = await get(`/api/vms/${id}`)
    const data = await res.json() as { status: string }
    expect(data.status).toBe('stopped')
  })

  it('rejects immutable field "id" with HTTP 400', async () => {
    const id = getVms()[0].id
    const res = await patch(`/api/vms/${id}`, { id: 'new-id' })
    expect(res.status).toBe(400)
  })

  it('rejects immutable field "createdAt" with HTTP 400', async () => {
    const id = getVms()[0].id
    const res = await patch(`/api/vms/${id}`, { createdAt: new Date().toISOString() })
    expect(res.status).toBe(400)
  })

  it('rejects immutable field "ipAddress" with HTTP 400', async () => {
    const id = getVms()[0].id
    const res = await patch(`/api/vms/${id}`, { ipAddress: '1.2.3.4' })
    expect(res.status).toBe(400)
  })

  it('rejects immutable field "region" with HTTP 400', async () => {
    const id = getVms()[0].id
    const res = await patch(`/api/vms/${id}`, { region: 'IST' })
    expect(res.status).toBe(400)
  })

  it('rejects immutable field "diskType" with HTTP 400', async () => {
    const id = getVms()[0].id
    const res = await patch(`/api/vms/${id}`, { diskType: 'HDD' })
    expect(res.status).toBe(400)
  })

  it('rejects invalid status value with HTTP 400', async () => {
    const id = getVms()[0].id
    const res = await patch(`/api/vms/${id}`, { status: 'broken' })
    expect(res.status).toBe(400)
  })

  it('rejects negative cpu with HTTP 400', async () => {
    const id = getVms()[0].id
    const res = await patch(`/api/vms/${id}`, { cpu: 0 })
    expect(res.status).toBe(400)
  })

  it('rejects negative memory with HTTP 400', async () => {
    const id = getVms()[0].id
    const res = await patch(`/api/vms/${id}`, { memory: -1 })
    expect(res.status).toBe(400)
  })

  it('rejects negative disk with HTTP 400', async () => {
    const id = getVms()[0].id
    const res = await patch(`/api/vms/${id}`, { disk: -5 })
    expect(res.status).toBe(400)
  })

  it('returns 404 for nonexistent VM', async () => {
    const res = await patch('/api/vms/no-such-vm-patch', { status: 'stopped' })
    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// GET /api/vms/:id/metrics — MetricRange filtering
// ---------------------------------------------------------------------------

describe('GET /api/vms/:id/metrics — MetricRange', () => {
  const RANGE_POINTS: Record<string, number> = {
    '30m': 30,
    '1h': 30,
    '3h': 36,
    '1w': 42,
  }

  for (const [range, expectedPoints] of Object.entries(RANGE_POINTS)) {
    it(`range=${range} returns ${expectedPoints} metric points`, async () => {
      const id = getVms()[0].id
      const res = await get(`/api/vms/${id}/metrics?range=${range}`)
      expect(res.status).toBe(200)
      const data = await res.json() as unknown[]
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(expectedPoints)
    })
  }

  it('each metric point has timestamp, cpu, memory, disk', async () => {
    const id = getVms()[0].id
    const res = await get(`/api/vms/${id}/metrics?range=1h`)
    const data = await res.json() as Record<string, unknown>[]
    const point = data[0]
    expect(typeof point.timestamp).toBe('string')
    expect(typeof point.cpu).toBe('number')
    expect(typeof point.memory).toBe('number')
    expect(typeof point.disk).toBe('number')
  })

  it('timestamps are ascending (oldest first)', async () => {
    const id = getVms()[0].id
    const res = await get(`/api/vms/${id}/metrics?range=1h`)
    const data = await res.json() as { timestamp: string }[]
    for (let i = 1; i < data.length; i++) {
      expect(new Date(data[i].timestamp).getTime()).toBeGreaterThan(
        new Date(data[i - 1].timestamp).getTime(),
      )
    }
  })

  it('metric values are within plausible range (0-100)', async () => {
    const id = getVms()[0].id
    const res = await get(`/api/vms/${id}/metrics?range=1h`)
    const data = await res.json() as { cpu: number; memory: number; disk: number }[]
    data.forEach((p) => {
      expect(p.cpu).toBeGreaterThanOrEqual(0)
      expect(p.cpu).toBeLessThanOrEqual(100)
      expect(p.memory).toBeGreaterThanOrEqual(0)
      expect(p.memory).toBeLessThanOrEqual(100)
      expect(p.disk).toBeGreaterThanOrEqual(0)
      expect(p.disk).toBeLessThanOrEqual(100)
    })
  })

  it('defaults to 1h (30 points) when range param is omitted', async () => {
    const id = getVms()[0].id
    const res = await get(`/api/vms/${id}/metrics`)
    const data = await res.json() as unknown[]
    expect(data.length).toBe(30)
  })

  it('returns 404 for nonexistent VM', async () => {
    const res = await get('/api/vms/no-such-vm-metrics/metrics?range=1h')
    expect(res.status).toBe(404)
  })
})
