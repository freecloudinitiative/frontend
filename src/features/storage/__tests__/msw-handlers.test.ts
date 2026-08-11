/**
 * Storage MSW Handlers Integration Tests
 * Tests Scenarios 2.x, 3.x, 4.x, 9.x from PR-20-Test-Scenarios.md
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'
import { getBuckets } from '@/mocks/data/buckets'
import type { Bucket, StorageFile, StorageMetricPoint } from '@/features/storage/types'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Scenario 2 — Bucket API Endpoints', () => {
  it('2.1 — GET /api/buckets returns 200 OK and bucket list', async () => {
    const res = await fetch('http://localhost/api/buckets')
    expect(res.status).toBe(200)

    const data: Bucket[] = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThanOrEqual(6)
    const first = data[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('bucketName')
    expect(first).toHaveProperty('totalSize')
    expect(first).toHaveProperty('objectCount')
    expect(first).toHaveProperty('region')
    expect(first).toHaveProperty('access')
    expect(first).toHaveProperty('versioning')
    expect(first).toHaveProperty('lifecycleEnabled')
    expect(first).toHaveProperty('status')
    expect(first).toHaveProperty('createdAt')
  })

  it('2.2 — GET /api/buckets/:id returns single bucket details', async () => {
    const seedBuckets = getBuckets()
    const target = seedBuckets[0]

    const res = await fetch(`http://localhost/api/buckets/${target.id}`)
    expect(res.status).toBe(200)

    const data: Bucket = await res.json()
    expect(data.id).toBe(target.id)
    expect(data.bucketName).toBe(target.bucketName)
    expect(data.region).toBe(target.region)
  })

  it('2.3 — POST /api/buckets creates new bucket with 201 Created', async () => {
    const payload = {
      bucketName: 'new-test-bucket',
      region: 'ANK',
      access: 'private',
    }

    const res = await fetch('http://localhost/api/buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(201)

    const created: Bucket = await res.json()
    expect(typeof created.id).toBe('string')
    expect(created.bucketName).toBe(payload.bucketName)
    expect(created.region).toBe(payload.region)
    expect(created.access).toBe(payload.access)
    expect(created.totalSize).toBe(0)
    expect(created.objectCount).toBe(0)
    expect(created.status).toBe('active')

    // Verify it is added to list
    const listRes = await fetch('http://localhost/api/buckets')
    const list: Bucket[] = await listRes.json()
    expect(list.some((b) => b.id === created.id)).toBe(true)
  })

  it('2.4 — DELETE /api/buckets/:id removes bucket with 204 No Content', async () => {
    // Create a bucket to delete
    const createRes = await fetch('http://localhost/api/buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucketName: 'delete-me-bucket', region: 'IST', access: 'public-read' }),
    })
    const created: Bucket = await createRes.json()

    const deleteRes = await fetch(`http://localhost/api/buckets/${created.id}`, {
      method: 'DELETE',
    })
    expect(deleteRes.status).toBe(204)

    // Verify removed from list
    const listRes = await fetch('http://localhost/api/buckets')
    const list: Bucket[] = await listRes.json()
    expect(list.some((b) => b.id === created.id)).toBe(false)
  })
})

describe('Scenario 3 — File API Endpoints', () => {
  it('3.1 & 3.2 — GET /api/buckets/:id/files returns files list for specified bucket', async () => {
    const seedBuckets = getBuckets()
    const target = seedBuckets[0]

    const res = await fetch(`http://localhost/api/buckets/${target.id}/files`)
    expect(res.status).toBe(200)

    const files: StorageFile[] = await res.json()
    expect(Array.isArray(files)).toBe(true)
    expect(files.length).toBeGreaterThanOrEqual(5)
    expect(files.length).toBeLessThanOrEqual(15)

    files.forEach((file) => {
      expect(file.bucketId).toBe(target.id)
      expect(typeof file.id).toBe('string')
      expect(typeof file.key).toBe('string')
      expect(typeof file.size).toBe('number')
      expect(typeof file.contentType).toBe('string')
      expect(['standard', 'nearline', 'coldline', 'archive']).toContain(file.storageClass)
      expect(typeof file.lastModified).toBe('string')
    })
  })
})

describe('Scenario 4 — Metrics Endpoint', () => {
  it('4.1 — GET /api/buckets/:id/metrics returns 24-point time series', async () => {
    const seedBuckets = getBuckets()
    const target = seedBuckets[0]

    const res = await fetch(`http://localhost/api/buckets/${target.id}/metrics`)
    expect(res.status).toBe(200)

    const metrics: StorageMetricPoint[] = await res.json()
    expect(Array.isArray(metrics)).toBe(true)
    expect(metrics.length).toBe(24)

    metrics.forEach((point) => {
      expect(typeof point.timestamp).toBe('string')
      expect(typeof point.totalSize).toBe('number')
      expect(point.totalSize).toBeGreaterThanOrEqual(0)
      expect(typeof point.objectCount).toBe('number')
      expect(point.objectCount).toBeGreaterThanOrEqual(0)
      expect(typeof point.readOps).toBe('number')
      expect(point.readOps).toBeGreaterThanOrEqual(0)
      expect(typeof point.writeOps).toBe('number')
      expect(point.writeOps).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('Scenario 9 — Error Handling', () => {
  it('9.1 — GET /api/buckets/:id returns 404 for non-existent bucket ID', async () => {
    const res = await fetch('http://localhost/api/buckets/non-existent-id-9999')
    expect(res.status).toBe(404)

    const data = await res.json()
    expect(data).toEqual({ error: 'Bucket not found' })
  })

  it('9.1b — GET /api/buckets/:id/files returns 404 for non-existent bucket ID', async () => {
    const res = await fetch('http://localhost/api/buckets/non-existent-id-9999/files')
    expect(res.status).toBe(404)
  })

  it('9.1c — GET /api/buckets/:id/metrics returns 404 for non-existent bucket ID', async () => {
    const res = await fetch('http://localhost/api/buckets/non-existent-id-9999/metrics')
    expect(res.status).toBe(404)
  })

  it('9.2 — POST /api/buckets returns 400 for invalid bucketName', async () => {
    const res = await fetch('http://localhost/api/buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucketName: 'Invalid Name With Spaces', region: 'ANK', access: 'private' }),
    })
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toContain('bucketName must be lowercase')
  })

  it('9.2b — POST /api/buckets returns 400 for missing/invalid access', async () => {
    const res = await fetch('http://localhost/api/buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucketName: 'valid-name', region: 'ANK', access: 'invalid-access-level' }),
    })
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toContain('access must be one of')
  })

  it('9.3 — DELETE /api/buckets/:id returns 404 for non-existent bucket', async () => {
    const res = await fetch('http://localhost/api/buckets/non-existent-delete-id', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)
  })
})
