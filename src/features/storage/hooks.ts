import { useQuery } from '@tanstack/react-query'
import { createResourceHooks, createResourceKeys } from '@/lib/queryFactory'
import {
  createBucket,
  deleteBucket,
  getBucket,
  getBucketAccessPolicies,
  getBucketFiles,
  getBucketMetrics,
  getBuckets,
  updateBucketSettings,
} from './api'
import type { CreateBucketInput } from './types'

export const storageKeys = {
  ...createResourceKeys('buckets'),
  files: (bucketId: string) => ['buckets', bucketId, 'files'] as const,
  metrics: (bucketId: string) => ['buckets', bucketId, 'metrics'] as const,
  accessPolicies: (bucketId: string) => ['buckets', bucketId, 'access-policies'] as const,
}

const resourceHooks = createResourceHooks<
  Awaited<ReturnType<typeof getBucket>>,
  Awaited<ReturnType<typeof getBucket>>,
  CreateBucketInput
>({
  keys: storageKeys,
  list: getBuckets,
  get: getBucket,
  create: createBucket,
  remove: deleteBucket,
  updateSettings: updateBucketSettings,
})

export const useBuckets = resourceHooks.useList
export const useBucket = resourceHooks.useDetail
export const useCreateBucket = resourceHooks.useCreate
export const useDeleteBucket = resourceHooks.useRemove
export const useUpdateBucketSettings = resourceHooks.useUpdateSettings

export function useBucketFiles(bucketId: string | undefined) {
  return useQuery({
    queryKey: storageKeys.files(bucketId ?? ''),
    queryFn: () => getBucketFiles(bucketId!),
    enabled: Boolean(bucketId),
  })
}

export function useBucketMetrics(bucketId: string | undefined) {
  return useQuery({
    queryKey: storageKeys.metrics(bucketId ?? ''),
    queryFn: () => getBucketMetrics(bucketId!),
    enabled: Boolean(bucketId),
  })
}

export function useBucketAccessPolicies(bucketId: string | undefined) {
  return useQuery({
    queryKey: storageKeys.accessPolicies(bucketId ?? ''),
    queryFn: () => getBucketAccessPolicies(bucketId!),
    enabled: Boolean(bucketId),
  })
}
