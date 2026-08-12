/**
 * Storage Service Data Layer — Types & Mock Data Tests
 * Tests Scenarios 1.x, 6.x, and 8.x from PR-20-Test-Scenarios.md
 */
import { describe, it, expect } from 'vitest'
import { getBuckets, getFilesForBucket } from '@/mocks/data/buckets'
import { storageHandlers } from '@/mocks/handlers/storage'
import type { Bucket, CreateBucketInput, StorageFile, StorageMetricPoint } from '@/features/storage/types'

describe('Scenario 1 — Mock Data Generation', () => {
  it('1.1 — Bucket Data: returns 6-8 buckets with realistic names and required fields', () => {
    const buckets: Bucket[] = getBuckets()
    expect(buckets.length).toBeGreaterThanOrEqual(6)
    expect(buckets.length).toBeLessThanOrEqual(8)

    const expectedNames = ['prod-backups', 'app-assets', 'data-lake-raw', 'logs-archive']
    const bucketNames = buckets.map((b) => b.bucketName)
    expectedNames.forEach((name) => {
      expect(bucketNames).toContain(name)
    })

    buckets.forEach((b) => {
      expect(typeof b.id).toBe('string')
      expect(typeof b.bucketName).toBe('string')
      expect(typeof b.totalSize).toBe('number')
      expect(typeof b.objectCount).toBe('number')
      expect(typeof b.region).toBe('string')
      expect(['private', 'public-read', 'public-read-write']).toContain(b.access)
      expect(typeof b.versioning).toBe('boolean')
      expect(typeof b.lifecycleEnabled).toBe('boolean')
      expect(['active', 'archived']).toContain(b.status)
      expect(typeof b.createdAt).toBe('string')
      expect(new Date(b.createdAt).toString()).not.toBe('Invalid Date')
    })
  })

  it('1.2 — File Data: each bucket has 5-15 files in separate Map<bucketId, StorageFile[]>', () => {
    const buckets = getBuckets()
    buckets.forEach((b) => {
      const files = getFilesForBucket(b.id)
      expect(Array.isArray(files)).toBe(true)
      expect(files.length).toBeGreaterThanOrEqual(5)
      expect(files.length).toBeLessThanOrEqual(15)

      files.forEach((f) => {
        expect(typeof f.id).toBe('string')
        expect(f.bucketId).toBe(b.id)
        expect(typeof f.key).toBe('string')
        expect(f.key.length).toBeGreaterThan(0)
        expect(typeof f.size).toBe('number')
        expect(f.size).toBeGreaterThan(0)
        expect(typeof f.contentType).toBe('string')
        expect(['standard', 'nearline', 'coldline', 'archive']).toContain(f.storageClass)
        expect(typeof f.lastModified).toBe('string')
        expect(new Date(f.lastModified).toString()).not.toBe('Invalid Date')
      })
    })
  })
})

describe('Scenario 6 — Type Safety & Input Contracts', () => {
  it('6.1 & 6.2 — StorageFile and Bucket types enforce required field shapes', () => {
    const file: StorageFile = {
      id: 'f-123',
      bucketId: 'b-456',
      key: 'test/file.png',
      size: 1024,
      contentType: 'image/png',
      storageClass: 'standard',
      lastModified: new Date().toISOString(),
    }
    expect(file.storageClass).toBe('standard')

    const bucket: Bucket = {
      id: 'b-456',
      bucketName: 'my-bucket',
      totalSize: 2048,
      objectCount: 1,
      region: 'ANK',
      zone: 'ank-1',
      access: 'private',
      versioning: true,
      lifecycleEnabled: false,
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    expect(bucket.access).toBe('private')

    const metricPoint: StorageMetricPoint = {
      timestamp: new Date().toISOString(),
      totalSize: 5000,
      objectCount: 10,
      readOps: 100,
      writeOps: 20,
    }
    expect(metricPoint.readOps).toBe(100)
  })

  it('6.3 — CreateBucketInput requires bucketName, region, access', () => {
    const input: CreateBucketInput = {
      bucketName: 'test-create-bucket',
      region: 'IST',
      access: 'public-read',
    }
    expect(input.bucketName).toBe('test-create-bucket')
  })
})

describe('Scenario 8 — MSW Handler Registration', () => {
  it('8.1 — All 7 storage handlers are exported', () => {
    expect(Array.isArray(storageHandlers)).toBe(true)
    expect(storageHandlers.length).toBe(7)
  })
})
