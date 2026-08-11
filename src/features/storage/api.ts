import apiClient from '@/lib/axios'
import type { Bucket, CreateBucketInput, StorageFile, StorageMetricPoint } from './types'

export async function getBuckets(): Promise<Bucket[]> {
  const { data } = await apiClient.get<Bucket[]>('/api/buckets')
  return data
}

export async function getBucket(id: string): Promise<Bucket> {
  const { data } = await apiClient.get<Bucket>(`/api/buckets/${id}`)
  return data
}

export async function createBucket(input: CreateBucketInput): Promise<Bucket> {
  const { data } = await apiClient.post<Bucket>('/api/buckets', input)
  return data
}

export async function deleteBucket(id: string): Promise<void> {
  await apiClient.delete(`/api/buckets/${id}`)
}

export async function getBucketFiles(bucketId: string): Promise<StorageFile[]> {
  const { data } = await apiClient.get<StorageFile[]>(`/api/buckets/${bucketId}/files`)
  return data
}

export async function getBucketMetrics(bucketId: string): Promise<StorageMetricPoint[]> {
  const { data } = await apiClient.get<StorageMetricPoint[]>(`/api/buckets/${bucketId}/metrics`)
  return data
}
