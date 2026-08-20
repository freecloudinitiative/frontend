import { createResourceApi } from '@/lib/apiResource'
import apiClient from '@/lib/axios'
import type { Bucket, BucketAccessPolicy, CreateBucketInput, StorageFile, StorageMetricPoint } from './types'

const resource = createResourceApi<Bucket, CreateBucketInput>('/api/buckets')

export const getBuckets = resource.list
export const getBucket = resource.get
export const createBucket = resource.create
export const deleteBucket = resource.remove
export const updateBucketSettings = resource.updateSettings

export async function getBucketFiles(bucketId: string): Promise<StorageFile[]> {
  const { data } = await apiClient.get<StorageFile[]>(`/api/buckets/${bucketId}/files`)
  return data
}

export async function getBucketMetrics(bucketId: string): Promise<StorageMetricPoint[]> {
  const { data } = await apiClient.get<StorageMetricPoint[]>(`/api/buckets/${bucketId}/metrics`)
  return data
}

export async function getBucketAccessPolicies(bucketId: string): Promise<BucketAccessPolicy[]> {
  const { data } = await apiClient.get<BucketAccessPolicy[]>(`/api/buckets/${bucketId}/access-policies`)
  return data
}

/**
 * Maximum allowed upload file size in bytes (12 MiB).
 * Mirrors `client_max_body_size 12m` in frontend/nginx.conf,
 * `DefaultMaxBodyBytes` (12582912) in api-gateway, and
 * `service.ProxyUploadMaxBytes` in storage-service.
 */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024 // 12 MiB

export async function uploadObject(
  bucketId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MiB) exceeds the 12 MiB upload limit`)
  }

  await apiClient.put(`/api/buckets/${bucketId}/objects`, file, {
    params: { key: file.name },
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    },
  })
}

export async function downloadObject(bucketId: string, key: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/api/buckets/${bucketId}/objects/content`, {
    params: { key },
    responseType: 'blob',
  })
  return data
}

export async function deleteObject(bucketId: string, key: string): Promise<void> {
  await apiClient.delete(`/api/buckets/${bucketId}/objects`, {
    params: { key },
  })
}

