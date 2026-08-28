import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createResourceHooks, createResourceKeys } from '@/lib/queryFactory'
import {
  createBucket,
  createBucketAccessPolicy,
  deleteBucket,
  deleteBucketAccessPolicy,
  deleteObject,
  downloadObject,
  getBucket,
  getBucketAccessPolicies,
  getBucketFiles,
  getBucketMetrics,
  getBuckets,
  updateBucketSettings,
  uploadObject,
} from './api'
import type { CreateBucketAccessPolicyInput, CreateBucketInput, UpdateBucketSettingsInput } from './types'

export const storageKeys = {
  ...createResourceKeys('buckets'),
  files: (bucketId: string) => ['buckets', bucketId, 'files'] as const,
  metrics: (bucketId: string) => ['buckets', bucketId, 'metrics'] as const,
  accessPolicies: (bucketId: string) => ['buckets', bucketId, 'access-policies'] as const,
}

const resourceHooks = createResourceHooks<
  Awaited<ReturnType<typeof getBucket>>,
  Awaited<ReturnType<typeof getBucket>>,
  CreateBucketInput,
  UpdateBucketSettingsInput
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

export function useCreateBucketAccessPolicy(bucketId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBucketAccessPolicyInput) => createBucketAccessPolicy(bucketId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.accessPolicies(bucketId) })
    },
  })
}

export function useDeleteBucketAccessPolicy(bucketId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (policyId: string) => deleteBucketAccessPolicy(bucketId, policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.accessPolicies(bucketId) })
    },
  })
}

/**
 * Triggers a client-side file download for a binary Blob via an ephemeral Object URL.
 * Cleans up and revokes the URL shortly after triggering the download.
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  if (typeof window === 'undefined' || !window.URL || typeof document === 'undefined') return
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    if (a.parentNode) {
      document.body.removeChild(a)
    }
    window.URL.revokeObjectURL(url)
  }, 100)
}

export function useUploadObject(bucketId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: { file: File; onProgress?: (pct: number) => void; bucketId?: string } | File) => {
      const isFile = variables instanceof File || (typeof variables === 'object' && 'name' in variables && !('file' in variables))
      const file = isFile ? (variables as File) : (variables as { file: File }).file
      const onProgress = !isFile ? (variables as { onProgress?: (pct: number) => void }).onProgress : undefined
      const targetBucketId = !isFile ? ((variables as { bucketId?: string }).bucketId ?? bucketId) : bucketId
      if (!targetBucketId) throw new Error('bucketId is required for upload')
      return uploadObject(targetBucketId, file, onProgress)
    },
    onSuccess: (_, variables) => {
      const isFile = variables instanceof File || (typeof variables === 'object' && 'name' in variables && !('file' in variables))
      const targetBucketId = !isFile ? ((variables as { bucketId?: string }).bucketId ?? bucketId) : bucketId
      if (targetBucketId) {
        queryClient.invalidateQueries({ queryKey: storageKeys.files(targetBucketId) })
        queryClient.invalidateQueries({ queryKey: storageKeys.metrics(targetBucketId) })
        queryClient.invalidateQueries({ queryKey: storageKeys.detail(targetBucketId) })
        queryClient.invalidateQueries({ queryKey: storageKeys.all })
      }
    },
  })
}

export function useDownloadObject(bucketId?: string) {
  return useMutation({
    mutationFn: async (variables: string | { bucketId?: string; key: string; filename?: string }) => {
      const isString = typeof variables === 'string'
      const key = isString ? variables : variables.key
      const targetBucketId = isString ? bucketId : (variables.bucketId ?? bucketId)
      const filename = (!isString && variables.filename) ? variables.filename : (key.split('/').pop() || key)
      if (!targetBucketId) throw new Error('bucketId is required for download')
      const blob = await downloadObject(targetBucketId, key)
      triggerBlobDownload(blob, filename)
      return blob
    },
  })
}

export function useDeleteObject(bucketId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: string | { bucketId?: string; key: string }) => {
      const isString = typeof variables === 'string'
      const key = isString ? variables : variables.key
      const targetBucketId = isString ? bucketId : (variables.bucketId ?? bucketId)
      if (!targetBucketId) throw new Error('bucketId is required for delete')
      return deleteObject(targetBucketId, key)
    },
    onSuccess: (_, variables) => {
      const isString = typeof variables === 'string'
      const targetBucketId = isString ? bucketId : (variables.bucketId ?? bucketId)
      if (targetBucketId) {
        queryClient.invalidateQueries({ queryKey: storageKeys.files(targetBucketId) })
        queryClient.invalidateQueries({ queryKey: storageKeys.metrics(targetBucketId) })
        queryClient.invalidateQueries({ queryKey: storageKeys.detail(targetBucketId) })
        queryClient.invalidateQueries({ queryKey: storageKeys.all })
      }
    },
  })
}
