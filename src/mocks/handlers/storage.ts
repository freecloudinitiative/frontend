import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import { createGetByIdHandler, createDeleteHandler, createSettingsPatchHandler, createListHandler, defaultJitter as jitter, errorBody } from './utils'
import {
  getBuckets,
  getBucketById,
  createBucket,
  deleteBucket,
  getFilesForBucket,
  getFileFromBucket,
  addFileToBucket,
  deleteFileFromBucket,
  getAccessPoliciesForBucket,
  addAccessPolicyToBucket,
  deleteAccessPolicyFromBucket,
  updateBucketSettings,
} from '@/mocks/data/buckets'
import type { BucketAccessPermission, CreateBucketInput, StorageMetricPoint } from '@/features/storage/types'
import { BUCKET_CONSTRAINTS } from '@/lib/apiConstraints'

const VALID_ACCESS = new Set<string>(BUCKET_CONSTRAINTS.access)

// storage-service/internal/api/types.go: UpdateBucketSettingsInput
export const BUCKET_SETTINGS_UPDATE_KEYS = [
  'access',
  'versioning',
  'lifecycleEnabled',
  'status',
  'publicReadAccess',
  'confirmPublic',
] as const

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
  createListHandler('*/api/buckets', getBuckets),

  // GET /api/buckets/:id — single bucket
  createGetByIdHandler('*/api/buckets/:id', getBucketById, 'Bucket', jitter),

  // POST /api/buckets — create bucket
  http.post('*/api/buckets', async ({ request }) => {
    await delay(jitter())

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json(errorBody('invalid_input', 'Invalid JSON body'), { status: 400 })
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return HttpResponse.json(errorBody('invalid_input', 'Body must be a JSON object'), { status: 400 })
    }

    const b = body as Record<string, unknown>

    if (typeof b.bucketName !== 'string' || b.bucketName.trim().length === 0) {
      return HttpResponse.json(errorBody('invalid_input', 'bucketName is required and must be a non-empty string'), { status: 400 })
    }
    if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(b.bucketName)) {
      return HttpResponse.json(errorBody('invalid_input', 'bucketName must be lowercase alphanumeric with hyphens/dots'), { status: 400 })
    }
    if (typeof b.region !== 'string' || b.region.trim().length === 0) {
      return HttpResponse.json(errorBody('invalid_input', 'region is required'), { status: 400 })
    }
    if (typeof b.access !== 'string' || !VALID_ACCESS.has(b.access)) {
      return HttpResponse.json(errorBody('invalid_input', `access must be one of: ${[...VALID_ACCESS].join(', ')}`), { status: 400 })
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
  createDeleteHandler('*/api/buckets/:id', deleteBucket, 'Bucket', jitter),

  // GET /api/buckets/:id/files — file list for a bucket
  http.get('*/api/buckets/:id/files', async ({ params }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json(errorBody('resource_not_found', 'Bucket not found'), { status: 404 })
    }
    return HttpResponse.json(getFilesForBucket(params.id as string))
  }),

  // PUT /api/buckets/:id/objects — proxy upload object
  http.put('*/api/buckets/:id/objects', async ({ params, request }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json(errorBody('resource_not_found', 'Bucket not found'), { status: 404 })
    }

    const url = new URL(request.url)
    const key = url.searchParams.get('key')
    if (!key || key.trim().length === 0) {
      return HttpResponse.json(errorBody('invalid_input', '?key= is required'), { status: 400 })
    }

    const contentLengthHeader = request.headers.get('content-length')
    const contentType = request.headers.get('content-type') || 'application/octet-stream'

    // Check size limit: 12 MiB (12 * 1024 * 1024 = 12,582,912 bytes)
    const MAX_ALLOWED_BYTES = 12 * 1024 * 1024
    let size = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0

    const bodyBuffer = await request.arrayBuffer()
    if (bodyBuffer.byteLength > 0) {
      size = bodyBuffer.byteLength
    }

    if (size > MAX_ALLOWED_BYTES) {
      return HttpResponse.json(
        errorBody('invalid_input', 'upload exceeds the maximum allowed size of 12 MiB'),
        { status: 413 },
      )
    }

    addFileToBucket(params.id as string, {
      key,
      size: size > 0 ? size : 1024,
      contentType,
    })

    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/buckets/:id/objects/content — proxy download object
  http.get('*/api/buckets/:id/objects/content', async ({ params, request }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json(errorBody('resource_not_found', 'Bucket not found'), { status: 404 })
    }

    const url = new URL(request.url)
    const key = url.searchParams.get('key')
    if (!key || key.trim().length === 0) {
      return HttpResponse.json(errorBody('invalid_input', '?key= is required'), { status: 400 })
    }

    const file = getFileFromBucket(params.id as string, key)
    if (!file) {
      return HttpResponse.json(errorBody('resource_not_found', 'Object not found'), { status: 404 })
    }

    const filename = key.split('/').pop() || key
    const contentType = file.contentType || 'application/octet-stream'
    const blobContent = `Simulated file contents for object: ${key}`
    // Use Uint8Array instead of Blob: MSW's Node interceptor (undici) calls
    // .stream() on the response body, which is not implemented for Blob in
    // Node 18. TextEncoder produces a Uint8Array that every Node version handles.
    const body = new TextEncoder().encode(blobContent)

    return new HttpResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(body.byteLength),
      },
    })
  }),

  // DELETE /api/buckets/:id/objects — delete object
  http.delete('*/api/buckets/:id/objects', async ({ params, request }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json(errorBody('resource_not_found', 'Bucket not found'), { status: 404 })
    }

    const url = new URL(request.url)
    let key = url.searchParams.get('key')

    if (!key) {
      try {
        const body = (await request.json()) as { key?: string }
        if (body && typeof body.key === 'string') {
          key = body.key
        }
      } catch {
        // No JSON body
      }
    }

    if (!key || key.trim().length === 0) {
      return HttpResponse.json(errorBody('invalid_input', 'key is required, as ?key= or a JSON body'), { status: 400 })
    }

    const deleted = deleteFileFromBucket(params.id as string, key)
    if (!deleted) {
      return HttpResponse.json(errorBody('resource_not_found', 'Object not found'), { status: 404 })
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // GET /api/buckets/:id/metrics — 24-point time series
  http.get('*/api/buckets/:id/metrics', async ({ params }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json(errorBody('resource_not_found', 'Bucket not found'), { status: 404 })
    }
    return HttpResponse.json(generateMetrics(params.id as string))
  }),

  // GET /api/buckets/:id/access-policies — IAM bindings for a bucket
  http.get('*/api/buckets/:id/access-policies', async ({ params }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json(errorBody('resource_not_found', 'Bucket not found'), { status: 404 })
    }
    return HttpResponse.json(getAccessPoliciesForBucket(params.id as string))
  }),

  // POST /api/buckets/:id/access-policies — create an access-policy record
  http.post('*/api/buckets/:id/access-policies', async ({ params, request }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json(errorBody('resource_not_found', 'Bucket not found'), { status: 404 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json(errorBody('invalid_input', 'Invalid JSON body'), { status: 400 })
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return HttpResponse.json(errorBody('invalid_input', 'Body must be a JSON object'), { status: 400 })
    }

    const b = body as Record<string, unknown>

    const VALID_PERMISSIONS = new Set<BucketAccessPermission>([
      'roles/storage.objectViewer',
      'roles/storage.objectAdmin',
      'roles/storage.admin',
    ])

    if (typeof b.principal !== 'string' || b.principal.trim().length === 0) {
      return HttpResponse.json(
        errorBody('invalid_input', 'principal is required', { principal: 'principal is required' }),
        { status: 400 },
      )
    }
    if (typeof b.permission !== 'string' || !VALID_PERMISSIONS.has(b.permission as BucketAccessPermission)) {
      return HttpResponse.json(
        errorBody('invalid_input', `permission must be one of: ${[...VALID_PERMISSIONS].join(', ')}`, { permission: `permission must be one of: ${[...VALID_PERMISSIONS].join(', ')}` }),
        { status: 400 },
      )
    }
    if (typeof b.resource !== 'string' || b.resource.trim().length === 0) {
      return HttpResponse.json(
        errorBody('invalid_input', 'resource is required', { resource: 'resource is required' }),
        { status: 400 },
      )
    }

    const newPolicy = addAccessPolicyToBucket(params.id as string, {
      principal: (b.principal as string).trim(),
      permission: b.permission as BucketAccessPermission,
      resource: (b.resource as string).trim(),
    })
    return HttpResponse.json(newPolicy, { status: 201 })
  }),

  // DELETE /api/buckets/:id/access-policies/:policyId — remove an access-policy record
  http.delete('*/api/buckets/:id/access-policies/:policyId', async ({ params }) => {
    await delay(jitter())

    const bucket = getBucketById(params.id as string)
    if (!bucket) {
      return HttpResponse.json(errorBody('resource_not_found', 'Bucket not found'), { status: 404 })
    }

    const deleted = deleteAccessPolicyFromBucket(params.id as string, params.policyId as string)
    if (!deleted) {
      return HttpResponse.json(errorBody('resource_not_found', 'Access policy not found'), { status: 404 })
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // PATCH /api/buckets/:id/settings
  createSettingsPatchHandler(
    '*/api/buckets/:id/settings',
    getBucketById,
    'Bucket',
    BUCKET_SETTINGS_UPDATE_KEYS,
    jitter,
    updateBucketSettings,
  ),
]
