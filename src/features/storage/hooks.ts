import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createBucket,
  deleteBucket,
  getBucket,
  getBucketFiles,
  getBucketMetrics,
  getBuckets,
} from './api'
import type { CreateBucketInput } from './types'

export const storageKeys = {
  all: ['buckets'] as const,
  detail: (id: string) => ['buckets', id] as const,
  files: (bucketId: string) => ['buckets', bucketId, 'files'] as const,
  metrics: (bucketId: string) => ['buckets', bucketId, 'metrics'] as const,
}

export function useBuckets() {
  return useQuery({ queryKey: storageKeys.all, queryFn: getBuckets })
}

export function useBucket(id: string | undefined) {
  return useQuery({
    queryKey: storageKeys.detail(id ?? ''),
    queryFn: () => getBucket(id!),
    enabled: Boolean(id),
  })
}

export function useCreateBucket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBucketInput) => createBucket(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.all })
    },
  })
}

export function useDeleteBucket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBucket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.all })
    },
  })
}

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
