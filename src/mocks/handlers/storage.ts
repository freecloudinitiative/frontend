import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import {
  getBuckets,
  getBucketById,
  createBucket,
  deleteBucket,
  getFilesForBucket,
  getAccessPoliciesForBucket,
} from '@/mocks/data/buckets'
import type { CreateBucketInput, StorageMetricPoint } from '@/features/storage/types'

// Artificial delay range (ms) — makes loading states visible during development
const DELAY_MIN = 300
const DELAY_MAX = 600

function jitter() {
  return faker.number.int({ min: DELAY_MIN, max: DELAY_MAX })
}

const VALID_ACCESS = new Set(['private', 'public-read', 'public-read-write'])

function generateMetrics(bucketId: string): StorageMetricPoint[] {
  const bucket = getBucketById(bucketId)
  const baseTotalSize = bucket?.totalSize ?? 5 * 1024 * 1024 * 1024
  const baseObjectCount = bucket?.objectCount ?? 20
  const now = Date.now()

  return Array.from({ length: 24 }, (_, i) => {
    const t = new Date(now - (23 - i) * 60 * 60 * 1000)
    const drift = faker.number.float({ min: 0.95, max: 1.05 })
    return {
      timestamp: t.toISOString(),
      totalSize: Math.round(baseTotalSize * drift),
      objectCount: Math.round(baseObjectCount * drift),
      readOps: faker.number.int({ min: 10, max: 5000 }),
      writeOps: faker.number.int({ min: 0, max: 500 }),
    }
  })
}

export const storageHandlers = [
  // GET /api/buckets — bucket list
  http.get('*/api/buckets', async () => {
    await delay(jitter())
    return HttpResponse.json(getBuckets())
  }),

  // GET /api/buckets/:id — single bucket
  http.get('*/api/buckets/:id', async ({ params }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }
    return HttpResponse.json(bucket)
  }),

  // POST /api/buckets — create bucket
  http.post('*/api/buckets', async ({ request }) => {
    await delay(jitter())

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return HttpResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
    }

    const b = body as Record<string, unknown>

    if (typeof b.bucketName !== 'string' || b.bucketName.trim().length === 0) {
      return HttpResponse.json({ error: 'bucketName is required and must be a non-empty string' }, { status: 400 })
    }
    if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(b.bucketName)) {
      return HttpResponse.json({ error: 'bucketName must be lowercase alphanumeric with hyphens/dots' }, { status: 400 })
    }
    if (typeof b.region !== 'string' || b.region.trim().length === 0) {
      return HttpResponse.json({ error: 'region is required' }, { status: 400 })
    }
    if (typeof b.access !== 'string' || !VALID_ACCESS.has(b.access)) {
      return HttpResponse.json({ error: `access must be one of: ${[...VALID_ACCESS].join(', ')}` }, { status: 400 })
    }

    const input: CreateBucketInput = {
      bucketName: b.bucketName.trim(),
      region: (b.region as string).trim().toUpperCase(),
      access: b.access as CreateBucketInput['access'],
    }

    const bucket = createBucket(input)
    return HttpResponse.json(bucket, { status: 201 })
  }),

  // DELETE /api/buckets/:id — delete bucket
  http.delete('*/api/buckets/:id', async ({ params }) => {
    await delay(jitter())

    const deleted = deleteBucket(params.id as string)
    if (!deleted) {
      return HttpResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/buckets/:id/files — file list for a bucket
  http.get('*/api/buckets/:id/files', async ({ params }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }
    return HttpResponse.json(getFilesForBucket(params.id as string))
  }),

  // GET /api/buckets/:id/metrics — 24-point time series
  http.get('*/api/buckets/:id/metrics', async ({ params }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }
    return HttpResponse.json(generateMetrics(params.id as string))
  }),

  // GET /api/buckets/:id/access-policies — IAM bindings for a bucket
  http.get('*/api/buckets/:id/access-policies', async ({ params }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }
    return HttpResponse.json(getAccessPoliciesForBucket(params.id as string))
  }),
]
