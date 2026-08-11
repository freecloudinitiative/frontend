/**
 * PR #15 — Database service: Axios API layer tests
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'
import { getDatabases as getMockDatabases } from '@/mocks/data/databases'
import {
  getDatabases,
  getDatabase,
  createDatabase,
  deleteDatabase,
  patchDatabase,
  getDatabaseMetrics,
  executeSqlScript,
} from '@/features/database/api'
import type { Database, DatabaseMetricPoint, SqlExecutionResult } from '@/features/database/types'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Section 6 – Database Axios API layer', () => {
  it('6.1 – getDatabases() returns array of Database', async () => {
    const dbs: Database[] = await getDatabases()
    expect(Array.isArray(dbs)).toBe(true)
    expect(dbs.length).toBeGreaterThanOrEqual(8)
    const db = dbs[0]
    expect(typeof db.id).toBe('string')
    expect(['postgres', 'mysql', 'redis']).toContain(db.engine)
  })

  it('6.2 – getDatabase(id) returns single Database', async () => {
    const id = getMockDatabases()[0].id
    const db: Database = await getDatabase(id)
    expect(db.id).toBe(id)
    expect(typeof db.connectionString).toBe('string')
  })

  it('6.3 – createDatabase(input) returns new Database in pending state', async () => {
    const db: Database = await createDatabase({
      name: 'axios-test-db',
      engine: 'mysql',
      version: '8.0.35',
      storageSize: 100,
      cpu: 4,
      memory: 8,
      region: 'IST',
    })
    expect(typeof db.id).toBe('string')
    expect(db.engine).toBe('mysql')
    expect(db.status).toBe('pending')
  })

  it('6.4 – deleteDatabase(id) resolves for existing database', async () => {
    const created = await createDatabase({ name: 'axios-del-db', engine: 'redis', version: '7.2', storageSize: 20, cpu: 1, memory: 1, region: 'ANK' })
    await expect(deleteDatabase(created.id)).resolves.toBeUndefined()
  })

  it('6.5 – patchDatabase(id, partial) returns updated Database', async () => {
    const id = getMockDatabases()[0].id
    const updated: Database = await patchDatabase(id, { status: 'stopped' })
    expect(updated.id).toBe(id)
    expect(updated.status).toBe('stopped')
  })

  it('6.6 – getDatabaseMetrics(id) returns 24-point array', async () => {
    const id = getMockDatabases()[0].id
    const metrics: DatabaseMetricPoint[] = await getDatabaseMetrics(id)
    expect(Array.isArray(metrics)).toBe(true)
    expect(metrics.length).toBe(24)
    expect(typeof metrics[0].cpuUsage).toBe('number')
    expect(typeof metrics[0].timestamp).toBe('string')
  })

  it('6.7 – executeSqlScript() returns result for SELECT', async () => {
    const id = getMockDatabases()[0].id
    const result: SqlExecutionResult = await executeSqlScript(id, 'SELECT * FROM test')
    expect(result.success).toBe(true)
    expect(Array.isArray(result.resultData)).toBe(true)
  })

  it('6.8 – getDatabase() throws for unknown ID', async () => {
    await expect(getDatabase('no-such-db-axios')).rejects.toThrow()
  })

  it('6.9 – deleteDatabase() throws for unknown ID', async () => {
    await expect(deleteDatabase('no-such-db-del-axios')).rejects.toThrow()
  })

  it('6.10 – executeSqlScript() throws on DROP statement (403)', async () => {
    const id = getMockDatabases()[0].id
    await expect(executeSqlScript(id, 'DROP TABLE users')).rejects.toThrow()
  })
})
