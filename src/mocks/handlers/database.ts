import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import {
  getDatabases,
  getDatabaseById,
  createDatabase,
  deleteDatabase,
  updateDatabase,
  type DatabaseStatus,
  type BackupStatus,
} from '@/mocks/data/databases'
import type { CreateDatabaseInput, UpdateDatabaseInput } from '@/features/database/types'

// Artificial delay range (ms) — makes loading states visible during development
const DELAY_MIN = 300
const DELAY_MAX = 600

function jitter() {
  return faker.number.int({ min: DELAY_MIN, max: DELAY_MAX })
}

const DANGEROUS_KEYWORDS = ['DROP', 'TRUNCATE', 'ALTER', 'DELETE']
const MAX_SCRIPT_LENGTH = 10_000

function generateSelectResultRows() {
  const rowCount = faker.number.int({ min: 5, max: 20 })
  return Array.from({ length: rowCount }, (_, i) => ({
    id: i + 1,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    created_at: faker.date.past().toISOString(),
  }))
}

function generateMetricSeries() {
  const points = 24
  const intervalMs = 5 * 60_000
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(now - (points - 1 - i) * intervalMs).toISOString(),
    connections: Math.round(5 + Math.random() * 95),
    queriesPerSecond: Math.round(10 + Math.random() * 490),
    diskIO: Math.round(1 + Math.random() * 99),
    cpuUsage: Math.round(5 + Math.random() * 90),
    memoryUsage: Math.round(10 + Math.random() * 85),
  }))
}

export const databaseHandlers = [
  // GET /api/databases — full list
  http.get('/api/databases', async ({ request }) => {
    await delay(jitter())

    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status')

    let databases = getDatabases()
    if (statusFilter) {
      databases = databases.filter((db) => db.status === statusFilter)
    }

    return HttpResponse.json(databases)
  }),

  // GET /api/databases/:id — single database
  http.get('/api/databases/:id', async ({ params }) => {
    await delay(jitter())

    const database = getDatabaseById(params.id as string)
    if (!database) {
      return HttpResponse.json({ error: 'Database not found' }, { status: 404 })
    }
    return HttpResponse.json(database)
  }),

  // POST /api/databases — create a new database
  http.post('/api/databases', async ({ request }) => {
    await delay(jitter())

    let body: Partial<CreateDatabaseInput> = {}
    try {
      body = (await request.json()) as Partial<CreateDatabaseInput>
    } catch {
      // allow empty body — defaults in createDatabase handle it
    }

    const VALID_ENGINES = new Set(['postgres', 'mysql', 'redis'])
    if ('engine' in body && (typeof body.engine !== 'string' || !VALID_ENGINES.has(body.engine))) {
      return HttpResponse.json({ error: 'Invalid engine' }, { status: 400 })
    }
    if ('name' in body && typeof body.name !== 'string') {
      return HttpResponse.json({ error: 'Invalid name' }, { status: 400 })
    }
    if ('version' in body && typeof body.version !== 'string') {
      return HttpResponse.json({ error: 'Invalid version' }, { status: 400 })
    }
    if ('storageSize' in body && (typeof body.storageSize !== 'number' || body.storageSize <= 0)) {
      return HttpResponse.json({ error: 'Invalid storageSize' }, { status: 400 })
    }
    if ('cpu' in body && (typeof body.cpu !== 'number' || body.cpu <= 0)) {
      return HttpResponse.json({ error: 'Invalid cpu' }, { status: 400 })
    }
    if ('memory' in body && (typeof body.memory !== 'number' || body.memory <= 0)) {
      return HttpResponse.json({ error: 'Invalid memory' }, { status: 400 })
    }

    const database = createDatabase(body)
    return HttpResponse.json(database, { status: 201 })
  }),

  // DELETE /api/databases/:id
  http.delete('/api/databases/:id', async ({ params }) => {
    await delay(jitter())

    const deleted = deleteDatabase(params.id as string)
    if (!deleted) {
      return HttpResponse.json({ error: 'Database not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/databases/:id/metrics — fake time series
  http.get('/api/databases/:id/metrics', async ({ params }) => {
    await delay(jitter())

    const database = getDatabaseById(params.id as string)
    if (!database) {
      return HttpResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    return HttpResponse.json(generateMetricSeries())
  }),

  // PATCH /api/databases/:id — partial update (e.g. status change)
  http.patch('/api/databases/:id', async ({ params, request }) => {
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

    const allowedKeys = new Set(['name', 'status', 'cpu', 'memory', 'storageSize', 'backupStatus'])
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

    const VALID_BACKUP_STATUSES = new Set(['healthy', 'failed', 'in-progress', 'none'])
    if ('backupStatus' in bodyObj) {
      if (typeof bodyObj.backupStatus !== 'string' || !VALID_BACKUP_STATUSES.has(bodyObj.backupStatus)) {
        return HttpResponse.json({ error: 'Invalid backupStatus' }, { status: 400 })
      }
    }

    if ('name' in bodyObj && typeof bodyObj.name !== 'string') {
      return HttpResponse.json({ error: 'Invalid name' }, { status: 400 })
    }
    if ('cpu' in bodyObj && (typeof bodyObj.cpu !== 'number' || bodyObj.cpu <= 0)) {
      return HttpResponse.json({ error: 'Invalid cpu' }, { status: 400 })
    }
    if ('memory' in bodyObj && (typeof bodyObj.memory !== 'number' || bodyObj.memory <= 0)) {
      return HttpResponse.json({ error: 'Invalid memory' }, { status: 400 })
    }
    if ('storageSize' in bodyObj && (typeof bodyObj.storageSize !== 'number' || bodyObj.storageSize <= 0)) {
      return HttpResponse.json({ error: 'Invalid storageSize' }, { status: 400 })
    }

    const validatedInput: UpdateDatabaseInput = {}
    if ('name' in bodyObj) validatedInput.name = bodyObj.name as string
    if ('status' in bodyObj) validatedInput.status = bodyObj.status as DatabaseStatus
    if ('cpu' in bodyObj) validatedInput.cpu = bodyObj.cpu as number
    if ('memory' in bodyObj) validatedInput.memory = bodyObj.memory as number
    if ('storageSize' in bodyObj) validatedInput.storageSize = bodyObj.storageSize as number
    if ('backupStatus' in bodyObj) validatedInput.backupStatus = bodyObj.backupStatus as BackupStatus

    const updated = updateDatabase(params.id as string, validatedInput)
    if (!updated) {
      return HttpResponse.json({ error: 'Database not found' }, { status: 404 })
    }
    return HttpResponse.json(updated)
  }),

  // POST /api/databases/:id/execute-sql — run a SQL script against the database
  http.post('/api/databases/:id/execute-sql', async ({ params, request }) => {
    const database = getDatabaseById(params.id as string)
    if (!database) {
      return HttpResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    let body: { script?: unknown } = {}
    try {
      body = (await request.json()) as { script?: unknown }
    } catch {
      return HttpResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    if (typeof body.script !== 'string' || body.script.trim().length === 0) {
      return HttpResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    const script = body.script
    if (script.length > MAX_SCRIPT_LENGTH) {
      return HttpResponse.json({ error: 'Script exceeds 10,000 character limit' }, { status: 400 })
    }

    const upperScript = script.toUpperCase()
    const matchedKeyword = DANGEROUS_KEYWORDS.find((keyword) => upperScript.includes(keyword))
    if (matchedKeyword) {
      return HttpResponse.json({ error: `${matchedKeyword} statements are not permitted in this demo` }, { status: 403 })
    }

    await delay(faker.number.int({ min: 500, max: 1500 }))

    const trimmedScript = script.trim().toUpperCase()
    if (trimmedScript.startsWith('SELECT')) {
      return HttpResponse.json({
        success: true,
        resultData: generateSelectResultRows(),
        executedAt: new Date().toISOString(),
      })
    }

    return HttpResponse.json({
      success: true,
      rowsAffected: faker.number.int({ min: 1, max: 100 }),
      executedAt: new Date().toISOString(),
    })
  }),

  // POST /api/databases/:id/import-data — import a file into the database
  http.post('/api/databases/:id/import-data', async ({ params, request }) => {
    const database = getDatabaseById(params.id as string)
    if (!database) {
      return HttpResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return HttpResponse.json({ success: false, errorMessage: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!(file instanceof File)) {
      return HttpResponse.json({ success: false, errorMessage: 'File is required' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return HttpResponse.json({ success: false, errorMessage: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    await delay(faker.number.int({ min: 1000, max: 3000 }))

    return HttpResponse.json({
      success: true,
      rowsImported: faker.number.int({ min: 10, max: 1000 }),
    })
  }),
]
