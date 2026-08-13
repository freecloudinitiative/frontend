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
