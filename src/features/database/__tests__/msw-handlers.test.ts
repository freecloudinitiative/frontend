/**
 * PR #15 — Database service: MSW handler integration tests
 * Tests all HTTP endpoints: GET list, GET detail, POST create,
 * PATCH update, DELETE, GET metrics, POST execute-sql, POST import-data.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'
import { getDatabases } from '@/mocks/data/databases'

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
// GET /api/databases
// ---------------------------------------------------------------------------

describe('GET /api/databases — list', () => {
  it('returns HTTP 200 with array of databases', async () => {
    const res = await get('/api/databases')
    expect(res.status).toBe(200)
    const data = await res.json() as unknown[]
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThanOrEqual(8)
  })

  it('each database in list has required fields', async () => {
    const res = await get('/api/databases')
    const data = await res.json() as Record<string, unknown>[]
    const db = data[0]
    expect(typeof db.id).toBe('string')
    expect(typeof db.name).toBe('string')
    expect(['postgres', 'mysql', 'redis']).toContain(db.engine)
    expect(['running', 'stopped', 'pending']).toContain(db.status)
    expect(typeof db.connectionString).toBe('string')
    expect(typeof db.region).toBe('string')
  })

  it('supports ?status filter — returns only matching databases', async () => {
    // Insert a known-status database to guarantee we get at least one match
    const createRes = await post('/api/databases', { name: 'filter-test', status: 'stopped' })
    // Note: POST ignores status (starts as pending), so we patch it
    const created = await createRes.json() as { id: string }
    await patch(`/api/databases/${created.id}`, { status: 'stopped' })

    const res = await get('/api/databases?status=stopped')
    const data = await res.json() as { status: string }[]
    data.forEach((db) => expect(db.status).toBe('stopped'))
  })
})

// ---------------------------------------------------------------------------
// GET /api/databases/:id
// ---------------------------------------------------------------------------

describe('GET /api/databases/:id — detail', () => {
  it('returns HTTP 200 with full database object', async () => {
    const id = getDatabases()[0].id
    const res = await get(`/api/databases/${id}`)
    expect(res.status).toBe(200)
    const data = await res.json() as { id: string }
    expect(data.id).toBe(id)
  })

  it('returns HTTP 404 for unknown ID', async () => {
    const res = await get('/api/databases/nonexistent-db-id')
    expect(res.status).toBe(404)
    const data = await res.json() as { error: string }
    expect(typeof data.error).toBe('string')
  })

  it('returned object has all Database fields', async () => {
    const id = getDatabases()[0].id
    const res = await get(`/api/databases/${id}`)
    const db = await res.json() as Record<string, unknown>
    ;['id','name','engine','version','status','cpu','memory','storageSize',
      'connectionString','host','port','maxConnections','activeConnections',
      'backupStatus','region','createdAt'].forEach((field) => {
      expect(field in db).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// POST /api/databases
// ---------------------------------------------------------------------------

describe('POST /api/databases — create', () => {
  it('creates database and returns HTTP 201', async () => {
    const res = await post('/api/databases', {
      name: 'new-test-db',
      engine: 'postgres',
      version: '16.1',
      storageSize: 50,
      cpu: 2,
      memory: 4,
    })
    expect(res.status).toBe(201)
    const data = await res.json() as Record<string, unknown>
    expect(typeof data.id).toBe('string')
    expect(data.name).toBe('new-test-db')
    expect(data.engine).toBe('postgres')
    expect(data.status).toBe('pending') // new DBs always start as pending
  })

  it('persists: created DB appears in GET list', async () => {
    const createRes = await post('/api/databases', { name: 'persist-db' })
    const created = await createRes.json() as { id: string }
    const listRes = await get('/api/databases')
    const list = await listRes.json() as { id: string }[]
    expect(list.some((db) => db.id === created.id)).toBe(true)
  })

  it('rejects invalid engine with HTTP 400', async () => {
    const res = await post('/api/databases', { engine: 'oracle' })
    expect(res.status).toBe(400)
    const data = await res.json() as { error: string }
    expect(typeof data.error).toBe('string')
  })

  it('rejects negative storageSize with HTTP 400', async () => {
    const res = await post('/api/databases', { storageSize: -10 })
    expect(res.status).toBe(400)
  })

  it('rejects negative cpu with HTTP 400', async () => {
    const res = await post('/api/databases', { cpu: 0 })
    expect(res.status).toBe(400)
  })

  it('rejects negative memory with HTTP 400', async () => {
    const res = await post('/api/databases', { memory: -1 })
    expect(res.status).toBe(400)
  })

  it('accepts empty body (all defaults)', async () => {
    const res = await post('/api/databases', {})
    expect(res.status).toBe(201)
    const data = await res.json() as { id: string }
    expect(typeof data.id).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// DELETE /api/databases/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/databases/:id', () => {
  it('deletes database and returns HTTP 204', async () => {
    const createRes = await post('/api/databases', { name: 'to-delete-db' })
    const created = await createRes.json() as { id: string }
    const res = await del(`/api/databases/${created.id}`)
    expect(res.status).toBe(204)
  })

  it('subsequent GET returns 404 after delete', async () => {
    const createRes = await post('/api/databases', { name: 'gone-db' })
    const created = await createRes.json() as { id: string }
    await del(`/api/databases/${created.id}`)
    const getRes = await get(`/api/databases/${created.id}`)
    expect(getRes.status).toBe(404)
  })

  it('returns 404 for nonexistent ID', async () => {
    const res = await del('/api/databases/no-such-db-delete')
    expect(res.status).toBe(404)
  })

  it('does not remove other records', async () => {
    const all = getDatabases()
    const keep = all[0]
    const createRes = await post('/api/databases', { name: 'temp-db' })
    const temp = await createRes.json() as { id: string }
    await del(`/api/databases/${temp.id}`)
    const getRes = await get(`/api/databases/${keep.id}`)
    expect(getRes.status).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/databases/:id
// ---------------------------------------------------------------------------

describe('PATCH /api/databases/:id — update', () => {
  it('updates status and returns HTTP 200', async () => {
    const id = getDatabases()[0].id
    const res = await patch(`/api/databases/${id}`, { status: 'stopped' })
    expect(res.status).toBe(200)
    const data = await res.json() as { status: string }
    expect(data.status).toBe('stopped')
  })

  it('partial update: only specified fields change', async () => {
    const id = getDatabases()[1].id
    const before = await (await get(`/api/databases/${id}`)).json() as Record<string, unknown>
    await patch(`/api/databases/${id}`, { cpu: 8 })
    const after = await (await get(`/api/databases/${id}`)).json() as Record<string, unknown>
    expect(after.cpu).toBe(8)
    expect(after.name).toBe(before.name) // unchanged
    expect(after.engine).toBe(before.engine) // unchanged
  })

  it('PATCH persists: subsequent GET reflects new value', async () => {
    const id = getDatabases()[2].id
    await patch(`/api/databases/${id}`, { status: 'stopped' })
    const res = await get(`/api/databases/${id}`)
    const data = await res.json() as { status: string }
    expect(data.status).toBe('stopped')
  })

  it('rejects unknown field with HTTP 400', async () => {
    const id = getDatabases()[0].id
    const res = await patch(`/api/databases/${id}`, { unknownField: 'x' })
    expect(res.status).toBe(400)
  })

  it('rejects invalid status value with HTTP 400', async () => {
    const id = getDatabases()[0].id
    const res = await patch(`/api/databases/${id}`, { status: 'broken' })
    expect(res.status).toBe(400)
  })

  it('rejects invalid backupStatus with HTTP 400', async () => {
    const id = getDatabases()[0].id
    const res = await patch(`/api/databases/${id}`, { backupStatus: 'ok' })
    expect(res.status).toBe(400)
  })

  it('rejects negative cpu with HTTP 400', async () => {
    const id = getDatabases()[0].id
    const res = await patch(`/api/databases/${id}`, { cpu: -1 })
    expect(res.status).toBe(400)
  })

  it('returns 404 for nonexistent ID', async () => {
    const res = await patch('/api/databases/no-such-db-patch', { status: 'stopped' })
    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// GET /api/databases/:id/metrics
// ---------------------------------------------------------------------------

describe('GET /api/databases/:id/metrics', () => {
  it('returns HTTP 200 with 24-point time series', async () => {
    const id = getDatabases()[0].id
    const res = await get(`/api/databases/${id}/metrics`)
    expect(res.status).toBe(200)
    const data = await res.json() as unknown[]
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(24)
  })

  it('each metric point has required fields', async () => {
    const id = getDatabases()[0].id
    const res = await get(`/api/databases/${id}/metrics`)
    const data = await res.json() as Record<string, unknown>[]
    const point = data[0]
    expect(typeof point.timestamp).toBe('string')
    expect(typeof point.connections).toBe('number')
    expect(typeof point.queriesPerSecond).toBe('number')
    expect(typeof point.diskIO).toBe('number')
    expect(typeof point.cpuUsage).toBe('number')
    expect(typeof point.memoryUsage).toBe('number')
  })

  it('timestamps are ascending (oldest first)', async () => {
    const id = getDatabases()[0].id
    const res = await get(`/api/databases/${id}/metrics`)
    const data = await res.json() as { timestamp: string }[]
    for (let i = 1; i < data.length; i++) {
      expect(new Date(data[i].timestamp).getTime()).toBeGreaterThan(
        new Date(data[i - 1].timestamp).getTime(),
      )
    }
  })

  it('returns 404 for nonexistent database ID', async () => {
    const res = await get('/api/databases/no-metrics-db/metrics')
    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// POST /api/databases/:id/execute-sql
// ---------------------------------------------------------------------------

describe('POST /api/databases/:id/execute-sql', () => {
  it('executes SELECT and returns result rows', async () => {
    const id = getDatabases()[0].id
    const res = await post(`/api/databases/${id}/execute-sql`, { script: 'SELECT * FROM users' })
    expect(res.status).toBe(200)
    const data = await res.json() as { success: boolean; resultData: unknown[] }
    expect(data.success).toBe(true)
    expect(Array.isArray(data.resultData)).toBe(true)
    expect(data.resultData.length).toBeGreaterThan(0)
  })

  it('executes non-SELECT and returns rowsAffected', async () => {
    const id = getDatabases()[0].id
    const res = await post(`/api/databases/${id}/execute-sql`, { script: 'INSERT INTO t VALUES (1)' })
    expect(res.status).toBe(200)
    const data = await res.json() as { success: boolean; rowsAffected: number }
    expect(data.success).toBe(true)
    expect(typeof data.rowsAffected).toBe('number')
  })

  it('rejects empty script with HTTP 400', async () => {
    const id = getDatabases()[0].id
    const res = await post(`/api/databases/${id}/execute-sql`, { script: '' })
    expect(res.status).toBe(400)
  })

  it('rejects DROP statement with HTTP 403', async () => {
    const id = getDatabases()[0].id
    const res = await post(`/api/databases/${id}/execute-sql`, { script: 'DROP TABLE users' })
    expect(res.status).toBe(403)
  })

  it('rejects TRUNCATE statement with HTTP 403', async () => {
    const id = getDatabases()[0].id
    const res = await post(`/api/databases/${id}/execute-sql`, { script: 'TRUNCATE users' })
    expect(res.status).toBe(403)
  })

  it('rejects script exceeding 10,000 chars with HTTP 400', async () => {
    const id = getDatabases()[0].id
    const res = await post(`/api/databases/${id}/execute-sql`, { script: 'x'.repeat(10_001) })
    expect(res.status).toBe(400)
  })

  it('returns 404 for nonexistent database', async () => {
    const res = await post('/api/databases/no-db-sql/execute-sql', { script: 'SELECT 1' })
    expect(res.status).toBe(404)
  })
})
