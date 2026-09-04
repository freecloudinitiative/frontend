import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createResourceHooks, createResourceKeys } from '@/lib/queryFactory'
import {
  createDatabase,
  deleteDatabase,
  executeSqlScript,
  getDatabase,
  getDatabaseMetrics,
  getDatabases,
  importData,
  patchDatabase,
  updateDatabaseSettings,
} from './api'
import type { CreateDatabaseInput, ImportOptions, UpdateDatabaseInput } from './types'

export const databaseKeys = {
  ...createResourceKeys('databases'),
  metrics: (id: string) => ['databases', id, 'metrics'] as const,
  connections: (id: string) => ['databases', id, 'connections'] as const,
}

const resourceHooks = createResourceHooks<
  Awaited<ReturnType<typeof getDatabase>>,
  Awaited<ReturnType<typeof getDatabase>>,
  CreateDatabaseInput,
  UpdateDatabaseInput
>({
  keys: databaseKeys,
  list: getDatabases,
  get: getDatabase,
  create: createDatabase,
  remove: deleteDatabase,
  updateSettings: updateDatabaseSettings,
})

export const useDatabases = resourceHooks.useList
export const useDatabase = resourceHooks.useDetail
export const useCreateDatabase = resourceHooks.useCreate
export const useDeleteDatabase = resourceHooks.useRemove
export const useUpdateDatabaseSettings = resourceHooks.useUpdateSettings

export function useUpdateDatabase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, partial }: { id: string; partial: UpdateDatabaseInput }) =>
      patchDatabase(id, partial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: databaseKeys.all })
    },
  })
}

export function useDatabaseMetrics(id: string | undefined, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: databaseKeys.metrics(id ?? ''),
    queryFn: () => getDatabaseMetrics(id!),
    enabled: Boolean(id),
    refetchInterval: options?.refetchInterval,
  })
}

export function useExecuteSql() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ databaseId, script }: { databaseId: string; script: string }) =>
      executeSqlScript(databaseId, script),
    onSuccess: (_data, { databaseId }) => {
      queryClient.invalidateQueries({ queryKey: databaseKeys.metrics(databaseId) })
    },
  })
}

export function useImportData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ databaseId, file, options }: { databaseId: string; file: File; options: ImportOptions }) =>
      importData(databaseId, file, options),
    onSuccess: (_data, { databaseId }) => {
      queryClient.invalidateQueries({ queryKey: databaseKeys.detail(databaseId) })
      queryClient.invalidateQueries({ queryKey: databaseKeys.metrics(databaseId) })
    },
  })
}
