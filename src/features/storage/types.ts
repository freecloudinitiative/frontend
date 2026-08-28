export type StorageClass = 'standard' | 'nearline' | 'coldline' | 'archive'
export type BucketAccess = 'private' | 'public-read' | 'public-read-write'
export type BucketStatus = 'active' | 'archived'

export interface StorageFile {
  id: string
  bucketId: string
  key: string
  size: number
  contentType: string
  storageClass: StorageClass
  lastModified: string
}

export interface Bucket {
  id: string
  bucketName: string
  totalSize: number
  objectCount: number
  region: string
  zone: string
  access: BucketAccess
  versioning: boolean
  lifecycleEnabled: boolean
  status: BucketStatus
  createdAt: string
}

export interface CreateBucketInput {
  bucketName: string
  region: string
  zone?: string
  access: BucketAccess
}

export interface UpdateBucketSettingsInput {
  access?: BucketAccess
  versioning?: boolean
  lifecycleEnabled?: boolean
  status?: BucketStatus
  publicReadAccess?: boolean
  confirmPublic?: boolean
}

export interface StorageMetricPoint {
  timestamp: string
  totalSize: number
  objectCount: number
  readOps: number
  writeOps: number
}

export type BucketAccessPermission = 'roles/storage.objectViewer' | 'roles/storage.objectAdmin' | 'roles/storage.admin'

export interface BucketAccessPolicy {
  id: string
  principal: string
  permission: BucketAccessPermission
  resource: string
  createdAt: string
}

/** Fields accepted by `POST /api/buckets/{id}/access-policies`. `id` and `createdAt` are server-derived. */
export interface CreateBucketAccessPolicyInput {
  principal: string
  permission: BucketAccessPermission
  resource: string
}
