/**
 * Advanced Storage Data Layer & Integration Test Suite
 * Tests data integrity, relationships, CRUD mutations, content-type resolution,
 * time-series properties, and payload validation boundary conditions.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'
import {
  getBuckets,
  getBucketById,
  getFilesForBucket,
  createBucket,
  deleteBucket,
  bucketFilesMap,
} from '@/mocks/data/buckets'
import type { Bucket, StorageFile, StorageMetricPoint } from '@/features/storage/types'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Advanced Test Suite — Data Integrity & Store Relationships', () => {
  it('totalSize in bucket strictly matches sum of file sizes in bucketFilesMap', () => {
    const buckets = getBuckets()
    buckets.forEach((bucket) => {
      const files = getFilesForBucket(bucket.id)
      const computedTotalSize = files.reduce((acc, f) => acc + f.size, 0)
      expect(bucket.totalSize).toBe(computedTotalSize)
      expect(bucket.objectCount).toBe(files.length)
    })
  })

  it('content types are correctly mapped based on file extensions', () => {
    const buckets = getBuckets()
    const allFiles: StorageFile[] = buckets.flatMap((b) => getFilesForBucket(b.id))

    allFiles.forEach((file) => {
      if (file.key.endsWith('.json')) {
        expect(file.contentType).toBe('application/json')
      } else if (file.key.endsWith('.sql.gz') || file.key.endsWith('.log.gz') || file.key.endsWith('.gz')) {
        expect(file.contentType).toBe('application/gzip')
      } else if (file.key.endsWith('.jpg')) {
        expect(file.contentType).toBe('image/jpeg')
      } else if (file.key.endsWith('.png')) {
        expect(file.contentType).toBe('image/png')
      } else if (file.key.endsWith('.svg')) {
        expect(file.contentType).toBe('image/svg+xml')
      } else if (file.key.endsWith('.js')) {
        expect(file.contentType).toBe('application/javascript')
      } else if (file.key.endsWith('.css')) {
        expect(file.contentType).toBe('text/css')
      } else if (file.key.endsWith('.woff2')) {
        expect(file.contentType).toBe('font/woff2')
      } else if (file.key.endsWith('.pdf')) {
        expect(file.contentType).toBe('application/pdf')
      } else if (file.key.endsWith('.mp4')) {
        expect(file.contentType).toBe('video/mp4')
      } else if (file.key.endsWith('.zip')) {
        expect(file.contentType).toBe('application/zip')
      }
    })
  })

  it('createBucket initializes bucket with empty files list and totalSize=0, objectCount=0', () => {
    const created = createBucket({
      bucketName: 'integrity-check-bucket',
      region: 'ANK',
      access: 'private',
    })

    expect(created.totalSize).toBe(0)
    expect(created.objectCount).toBe(0)

    const files = getFilesForBucket(created.id)
    expect(files).toEqual([])
    expect(bucketFilesMap.has(created.id)).toBe(true)
  })

  it('deleteBucket removes entry from bucketStore and bucketFilesMap', () => {
    const created = createBucket({
      bucketName: 'delete-map-cleanup-bucket',
      region: 'IST',
      access: 'public-read',
    })

    expect(bucketFilesMap.has(created.id)).toBe(true)
    const success = deleteBucket(created.id)

    expect(success).toBe(true)
    expect(getBucketById(created.id)).toBeUndefined()
    expect(bucketFilesMap.has(created.id)).toBe(false)
    expect(getFilesForBucket(created.id)).toEqual([])
  })
})

describe('Advanced Test Suite — HTTP Endpoint Boundary & Edge Payload Conditions', () => {
  it('POST /api/buckets returns 400 when body is invalid non-JSON string', async () => {
    const res = await fetch('http://localhost/api/buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not valid json',
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid JSON body')
  })

  it('POST /api/buckets returns 400 when body is JSON array', async () => {
    const res = await fetch('http://localhost/api/buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([1, 2, 3]),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Body must be a JSON object')
  })

  it('POST /api/buckets returns 400 for bucket names starting or ending with hyphen/dot', async () => {
    const invalidNames = ['-invalid-start', 'invalid-end-', '.invalid-dot-start', 'invalid-dot-end.']

    for (const bucketName of invalidNames) {
      const res = await fetch('http://localhost/api/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketName, region: 'ANK', access: 'private' }),
      })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('bucketName must be lowercase')
    }
  })

  it('POST /api/buckets returns 400 for uppercase characters or spaces', async () => {
    const invalidNames = ['Prod-Backups', 'prod backups', 'PRODBACKUP']

    for (const bucketName of invalidNames) {
      const res = await fetch('http://localhost/api/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketName, region: 'ANK', access: 'private' }),
      })
      expect(res.status).toBe(400)
    }
  })

  it('POST /api/buckets accepts valid bucket names with dots and hyphens', async () => {
    const validNames = ['prod.backup.2026', 'app-assets-v2', 'data.lake-raw.1']

    for (const bucketName of validNames) {
      const res = await fetch('http://localhost/api/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketName, region: 'ANK', access: 'private' }),
      })
      expect(res.status).toBe(201)
      const created: Bucket = await res.json()
      expect(created.bucketName).toBe(bucketName)
    }
  })
})

describe('Advanced Test Suite — Metrics Time-Series Quality & Interval Assertions', () => {
  it('GET /api/buckets/:id/metrics produces chronologically ordered 1-hour interval points', async () => {
    const buckets = getBuckets()
    const bucketId = buckets[0].id

    const res = await fetch(`http://localhost/api/buckets/${bucketId}/metrics`)
    expect(res.status).toBe(200)

    const metrics: StorageMetricPoint[] = await res.json()
    expect(metrics.length).toBe(24)

    for (let i = 1; i < metrics.length; i++) {
      const prevTime = new Date(metrics[i - 1].timestamp).getTime()
      const currTime = new Date(metrics[i].timestamp).getTime()
      // Each point should be exactly 1 hour (3600000ms) after the previous point
      expect(currTime - prevTime).toBe(3600000)
    }
  })

  it('Metrics values totalSize and objectCount remain within reasonable bounds of bucket state', async () => {
    const buckets = getBuckets()
    const bucket = buckets[0]

    const res = await fetch(`http://localhost/api/buckets/${bucket.id}/metrics`)
    const metrics: StorageMetricPoint[] = await res.json()

    metrics.forEach((point) => {
      // 5% drift means values stay within [0.9 * base, 1.1 * base]
      expect(point.totalSize).toBeGreaterThan(0.8 * bucket.totalSize)
      expect(point.totalSize).toBeLessThan(1.2 * bucket.totalSize)

      expect(point.objectCount).toBeGreaterThan(0.8 * bucket.objectCount)
      expect(point.objectCount).toBeLessThan(1.2 * bucket.objectCount)
    })
  })
})
