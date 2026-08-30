import { faker } from '@faker-js/faker'
import type { Bucket, BucketAccess, BucketAccessPolicy, BucketStatus, CreateBucketInput, StorageFile } from '@/features/storage/types'
import { BUCKET_POLICY_CONSTRAINTS } from '@/lib/apiConstraints'

faker.seed(42)

const ZONE_SUFFIXES = ['1', '2'] as const

function regionToZone(region: string): string {
  return `${region.toLowerCase()}-${faker.helpers.arrayElement(ZONE_SUFFIXES)}`
}

// ---------------------------------------------------------------------------
// File generation helpers
// ---------------------------------------------------------------------------

const CONTENT_TYPES: Record<string, string> = {
  'sql.gz': 'application/gzip',
  'log.gz': 'application/gzip',
  '.gz': 'application/gzip',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.parquet': 'application/octet-stream',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
}

function guessContentType(key: string): string {
  for (const [ext, mime] of Object.entries(CONTENT_TYPES)) {
    if (key.endsWith(ext)) return mime
  }
  return 'application/octet-stream'
}

function randomDate(daysAgo: number): string {
  return faker.date.recent({ days: daysAgo }).toISOString()
}

function generateFilesForBucket(bucketId: string, bucketName: string): StorageFile[] {
  const count = faker.number.int({ min: 5, max: 15 })

  const templatesByBucket: Record<string, Array<() => string>> = {
    'prod-backups': [
      () => `backups/db-${faker.date.recent({ days: 90 }).toISOString().slice(0, 10)}.sql.gz`,
      () => `backups/redis-${faker.date.recent({ days: 90 }).toISOString().slice(0, 10)}.rdb.gz`,
      () => `snapshots/vol-${faker.string.alphanumeric(8)}.snap.gz`,
      () => `manifests/backup-manifest-${faker.date.recent({ days: 30 }).toISOString().slice(0, 10)}.json`,
    ],
    'app-assets': [
      () => `static/js/bundle.${faker.string.alphanumeric(8)}.js`,
      () => `static/css/main.${faker.string.alphanumeric(8)}.css`,
      () => `static/images/${faker.system.fileName().replace(/\.[^.]+$/, '.png')}`,
      () => `favicon.svg`,
      () => `fonts/${faker.word.noun()}-${faker.helpers.arrayElement(['Regular', 'Bold', 'Light'])}.woff2`,
      () => `media/hero-${faker.number.int({ min: 1, max: 5 })}.jpg`,
    ],
    'data-lake-raw': [
      () => `events/${faker.date.recent({ days: 90 }).toISOString().slice(0, 7)}/events-${faker.number.int({ min: 1, max: 31 }).toString().padStart(2, '0')}.parquet`,
      () => `logs/app-${faker.date.recent({ days: 90 }).toISOString().slice(0, 10)}.log.gz`,
      () => `schemas/${faker.word.noun()}_schema_v${faker.number.int({ min: 1, max: 5 })}.json`,
      () => `raw/${faker.system.directoryPath().replace(/^\//, '')}/data.csv`,
    ],
    'logs-archive': [
      () => `logs/app-${faker.date.recent({ days: 365 }).toISOString().slice(0, 10)}.log.gz`,
      () => `logs/access-${faker.date.recent({ days: 365 }).toISOString().slice(0, 10)}.log.gz`,
      () => `audit/audit-${faker.date.recent({ days: 365 }).toISOString().slice(0, 10)}.log.gz`,
      () => `metrics/system-${faker.date.recent({ days: 90 }).toISOString().slice(0, 10)}.log.gz`,
    ],
    'ml-datasets': [
      () => `datasets/train/batch-${faker.number.int({ min: 1, max: 100 }).toString().padStart(3, '0')}.parquet`,
      () => `datasets/test/batch-${faker.number.int({ min: 1, max: 20 }).toString().padStart(3, '0')}.parquet`,
      () => `models/checkpoint-epoch-${faker.number.int({ min: 1, max: 50 })}.zip`,
      () => `metadata/dataset-info.json`,
    ],
    'cdn-media': [
      () => `images/products/${faker.string.uuid()}.jpg`,
      () => `videos/demos/${faker.word.noun()}-demo.mp4`,
      () => `thumbnails/${faker.string.uuid()}-thumb.jpg`,
      () => `downloads/${faker.system.fileName().replace(/\.[^.]+$/, '.zip')}`,
    ],
    'infra-terraform': [
      () => `states/prod/terraform.tfstate`,
      () => `states/staging/terraform.tfstate`,
      () => `plans/plan-${faker.date.recent({ days: 30 }).toISOString().slice(0, 10)}.tfplan`,
      () => `modules/${faker.word.noun()}/main.tf.gz`,
    ],
    'user-uploads': [
      () => `uploads/${faker.date.recent({ days: 30 }).toISOString().slice(0, 10)}/${faker.string.uuid()}.jpg`,
      () => `uploads/${faker.date.recent({ days: 30 }).toISOString().slice(0, 10)}/${faker.string.uuid()}.png`,
      () => `documents/${faker.string.uuid()}.pdf`,
      () => `avatars/${faker.string.uuid()}-avatar.jpg`,
    ],
  }

  const templates = templatesByBucket[bucketName] ?? [
    () => `files/${faker.system.fileName()}`,
    () => `data/${faker.string.alphanumeric(12)}.json`,
  ]

  return Array.from({ length: count }, () => {
    const keyFn = faker.helpers.arrayElement(templates)
    const key = keyFn()
    return {
      id: faker.string.uuid(),
      bucketId,
      key,
      size: faker.number.int({ min: 1024, max: 2 * 1024 * 1024 * 1024 }),
      contentType: guessContentType(key),
      storageClass: faker.helpers.weightedArrayElement([
        { value: 'standard' as const, weight: 5 },
        { value: 'nearline' as const, weight: 2 },
        { value: 'coldline' as const, weight: 2 },
        { value: 'archive' as const, weight: 1 },
      ]),
      lastModified: randomDate(180),
    }
  })
}

// ---------------------------------------------------------------------------
// Access policy generation helpers
// ---------------------------------------------------------------------------

function generateAccessPrincipal(): string {
  const kind = faker.helpers.arrayElement([
    ...BUCKET_POLICY_CONSTRAINTS.principalLiterals,
    ...BUCKET_POLICY_CONSTRAINTS.principalKinds,
  ])
  return kind === 'public' ? kind : `${kind}:${faker.string.uuid()}`
}

function generateAccessPolicies(bucketName: string): BucketAccessPolicy[] {
  const count = faker.number.int({ min: 2, max: 4 })
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    principal: generateAccessPrincipal(),
    permission: faker.helpers.weightedArrayElement([
      { value: 'roles/storage.objectViewer' as const, weight: 5 },
      { value: 'roles/storage.objectAdmin' as const, weight: 3 },
      { value: 'roles/storage.admin' as const, weight: 2 },
    ]),
    resource: `buckets/${bucketName}`,
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  }))
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_BUCKETS: Omit<Bucket, 'totalSize' | 'objectCount'>[] = [
  {
    id: faker.string.uuid(),
    bucketName: 'prod-backups',
    region: 'IST',
    zone: 'ist-1',
    access: 'private',
    versioning: true,
    lifecycleEnabled: true,
    status: 'active',
    createdAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: faker.string.uuid(),
    bucketName: 'app-assets',
    region: 'IST',
    zone: 'ist-1',
    access: 'public-read',
    versioning: false,
    lifecycleEnabled: false,
    status: 'active',
    createdAt: new Date('2024-02-05').toISOString(),
  },
  {
    id: faker.string.uuid(),
    bucketName: 'data-lake-raw',
    region: 'IST',
    zone: 'ist-2',
    access: 'private',
    versioning: true,
    lifecycleEnabled: true,
    status: 'active',
    createdAt: new Date('2024-03-20').toISOString(),
  },
  {
    id: faker.string.uuid(),
    bucketName: 'logs-archive',
    region: 'IST',
    zone: 'ist-1',
    access: 'private',
    versioning: false,
    lifecycleEnabled: true,
    status: 'active',
    createdAt: new Date('2024-01-25').toISOString(),
  },
  {
    id: faker.string.uuid(),
    bucketName: 'ml-datasets',
    region: 'IST',
    zone: 'ist-2',
    access: 'private',
    versioning: true,
    lifecycleEnabled: false,
    status: 'active',
    createdAt: new Date('2024-04-15').toISOString(),
  },
  {
    id: faker.string.uuid(),
    bucketName: 'cdn-media',
    region: 'IST',
    zone: 'ist-1',
    access: 'public-read-write',
    versioning: false,
    lifecycleEnabled: true,
    status: 'active',
    createdAt: new Date('2024-05-01').toISOString(),
  },
  {
    id: faker.string.uuid(),
    bucketName: 'infra-terraform',
    region: 'IST',
    zone: 'ist-2',
    access: 'private',
    versioning: true,
    lifecycleEnabled: false,
    status: 'active',
    createdAt: new Date('2024-02-18').toISOString(),
  },
  {
    id: faker.string.uuid(),
    bucketName: 'user-uploads',
    region: 'IST',
    zone: 'ist-2',
    access: 'private',
    versioning: false,
    lifecycleEnabled: true,
    status: 'archived',
    createdAt: new Date('2023-11-12').toISOString(),
  },
]

// ---------------------------------------------------------------------------
// Mutable in-memory store
// ---------------------------------------------------------------------------

// Files stored separately, keyed by bucketId
export const bucketFilesMap = new Map<string, StorageFile[]>()

// Access policies, keyed by bucketId
export const bucketAccessPoliciesMap = new Map<string, BucketAccessPolicy[]>()

function assembleBuckets(): Bucket[] {
  return SEED_BUCKETS.map((partial) => {
    const files = generateFilesForBucket(partial.id, partial.bucketName)
    bucketFilesMap.set(partial.id, files)
    bucketAccessPoliciesMap.set(partial.id, generateAccessPolicies(partial.bucketName))
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    return {
      ...partial,
      totalSize,
      objectCount: files.length,
    }
  })
}

let bucketStore: Bucket[] = assembleBuckets()

export function resetBucketStore(): void {
  faker.seed(33)
  bucketFilesMap.clear()
  bucketAccessPoliciesMap.clear()
  bucketStore = assembleBuckets()
}

// ---------------------------------------------------------------------------
// CRUD functions
// ---------------------------------------------------------------------------

export function getBuckets(): Bucket[] {
  return bucketStore
}

export function getBucketById(id: string): Bucket | undefined {
  return bucketStore.find((b) => b.id === id)
}

export function createBucket(input: CreateBucketInput): Bucket {
  const id = faker.string.uuid()
  const bucket: Bucket = {
    id,
    bucketName: input.bucketName,
    region: input.region,
    zone: input.zone ?? regionToZone(input.region),
    access: input.access,
    versioning: false,
    lifecycleEnabled: false,
    status: 'active',
    totalSize: 0,
    objectCount: 0,
    createdAt: new Date().toISOString(),
  }
  bucketFilesMap.set(id, [])
  bucketAccessPoliciesMap.set(id, generateAccessPolicies(input.bucketName))
  bucketStore = [...bucketStore, bucket]
  return bucket
}

export function deleteBucket(id: string): boolean {
  const before = bucketStore.length
  bucketStore = bucketStore.filter((b) => b.id !== id)
  bucketFilesMap.delete(id)
  bucketAccessPoliciesMap.delete(id)
  return bucketStore.length < before
}

export function getFilesForBucket(bucketId: string): StorageFile[] {
  return bucketFilesMap.get(bucketId) ?? []
}

export function getFileFromBucket(bucketId: string, key: string): StorageFile | undefined {
  const files = bucketFilesMap.get(bucketId)
  return files?.find((f) => f.key === key)
}

export function addFileToBucket(
  bucketId: string,
  fileInput: { key: string; size: number; contentType?: string; storageClass?: StorageFile['storageClass'] },
): StorageFile {
  let files = bucketFilesMap.get(bucketId)
  if (!files) {
    files = []
    bucketFilesMap.set(bucketId, files)
  }

  const existingIdx = files.findIndex((f) => f.key === fileInput.key)
  const newFile: StorageFile = {
    id: existingIdx >= 0 ? files[existingIdx].id : faker.string.uuid(),
    bucketId,
    key: fileInput.key,
    size: fileInput.size,
    contentType: fileInput.contentType || guessContentType(fileInput.key),
    storageClass: fileInput.storageClass ?? 'standard',
    lastModified: new Date().toISOString(),
  }

  if (existingIdx >= 0) {
    files[existingIdx] = newFile
  } else {
    files.unshift(newFile)
  }

  const bucket = bucketStore.find((b) => b.id === bucketId)
  if (bucket) {
    bucket.objectCount = files.length
    bucket.totalSize = files.reduce((acc, f) => acc + f.size, 0)
  }

  return newFile
}

export function deleteFileFromBucket(bucketId: string, key: string): boolean {
  const files = bucketFilesMap.get(bucketId)
  if (!files) return false

  const initialLength = files.length
  const updatedFiles = files.filter((f) => f.key !== key)
  if (updatedFiles.length === initialLength) return false

  bucketFilesMap.set(bucketId, updatedFiles)

  const bucket = bucketStore.find((b) => b.id === bucketId)
  if (bucket) {
    bucket.objectCount = updatedFiles.length
    bucket.totalSize = updatedFiles.reduce((acc, f) => acc + f.size, 0)
  }

  return true
}

export function getAccessPoliciesForBucket(bucketId: string): BucketAccessPolicy[] {
  return bucketAccessPoliciesMap.get(bucketId) ?? []
}

export function addAccessPolicyToBucket(
  bucketId: string,
  policy: Omit<BucketAccessPolicy, 'id' | 'createdAt'>,
): BucketAccessPolicy {
  const policies = bucketAccessPoliciesMap.get(bucketId) ?? []
  const newPolicy: BucketAccessPolicy = {
    id: faker.string.uuid(),
    ...policy,
    createdAt: new Date().toISOString(),
  }
  bucketAccessPoliciesMap.set(bucketId, [...policies, newPolicy])
  return newPolicy
}

export function deleteAccessPolicyFromBucket(bucketId: string, policyId: string): boolean {
  const policies = bucketAccessPoliciesMap.get(bucketId)
  if (!policies) return false
  const updated = policies.filter((p) => p.id !== policyId)
  if (updated.length === policies.length) return false
  bucketAccessPoliciesMap.set(bucketId, updated)
  return true
}

export interface UpdateBucketSettingsInput {
  access?: BucketAccess
  versioning?: boolean
  lifecycleEnabled?: boolean
  status?: BucketStatus
  publicReadAccess?: boolean
}

export function updateBucketSettings(id: string, settings: UpdateBucketSettingsInput): Bucket | undefined {
  const idx = bucketStore.findIndex((b) => b.id === id)
  if (idx === -1) return undefined
  const current = bucketStore[idx]
  const updated: Bucket = {
    ...current,
    ...(settings.access !== undefined && { access: settings.access }),
    ...(settings.versioning !== undefined && { versioning: settings.versioning }),
    ...(settings.lifecycleEnabled !== undefined && { lifecycleEnabled: settings.lifecycleEnabled }),
    ...(settings.status !== undefined && { status: settings.status }),
    ...(settings.publicReadAccess !== undefined && {
      access: settings.publicReadAccess ? 'public-read' : 'private',
    }),
  }
  bucketStore = bucketStore.map((b, i) => (i === idx ? updated : b))
  return updated
}
