/**
 * Storage Axios API Layer Tests
 * Verifies that functions in features/storage/api.ts call MSW endpoints correctly.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'
import { getBuckets as getMockBuckets } from '@/mocks/data/buckets'
import {
  getBuckets,
  getBucket,
  createBucket,
  deleteBucket,
  getBucketFiles,
  getBucketMetrics,
} from '@/features/storage/api'
import type { Bucket, StorageFile, StorageMetricPoint } from '@/features/storage/types'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Storage Axios API Layer', () => {
  it('getBuckets() returns list of Bucket objects', async () => {
    const buckets: Bucket[] = await getBuckets()
    expect(Array.isArray(buckets)).toBe(true)
    expect(buckets.length).toBeGreaterThanOrEqual(6)
    const b = buckets[0]
    expect(typeof b.id).toBe('string')
    expect(typeof b.bucketName).toBe('string')
  })

  it('getBucket(id) returns a single Bucket object', async () => {
    const id = getMockBuckets()[0].id
    const bucket: Bucket = await getBucket(id)
    expect(bucket.id).toBe(id)
    expect(typeof bucket.bucketName).toBe('string')
  })

  it('createBucket() sends payload and returns created Bucket', async () => {
    const input = { bucketName: 'api-test-bucket', region: 'ANK', access: 'private' as const }
    const created: Bucket = await createBucket(input)
    expect(typeof created.id).toBe('string')
    expect(created.bucketName).toBe(input.bucketName)
    expect(created.region).toBe('ANK')
    expect(created.access).toBe('private')
  })

  it('deleteBucket() resolves for existing bucket ID', async () => {
    const created = await createBucket({ bucketName: 'api-del-bucket', region: 'IST', access: 'private' })
    await expect(deleteBucket(created.id)).resolves.toBeUndefined()
  })

  it('getBucketFiles(bucketId) returns file list', async () => {
    const id = getMockBuckets()[0].id
    const files: StorageFile[] = await getBucketFiles(id)
    expect(Array.isArray(files)).toBe(true)
    expect(files.length).toBeGreaterThanOrEqual(5)
    expect(files[0].bucketId).toBe(id)
  })

  it('getBucketMetrics(bucketId) returns 24 metric points', async () => {
    const id = getMockBuckets()[0].id
    const metrics: StorageMetricPoint[] = await getBucketMetrics(id)
    expect(Array.isArray(metrics)).toBe(true)
    expect(metrics.length).toBe(24)
  })

  it('getBucket() throws error for non-existent bucket ID', async () => {
    await expect(getBucket('non-existent-api-id')).rejects.toThrow()
  })

  it('createBucket() throws error for invalid bucketName format', async () => {
    await expect(createBucket({ bucketName: 'Invalid Name!', region: 'ANK', access: 'private' })).rejects.toThrow()
  })
})
