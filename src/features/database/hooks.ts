import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDatabase,
  deleteDatabase,
  executeSqlScript,
  getDatabase,
  getDatabaseMetrics,
  getDatabases,
  importData,
  patchDatabase,
} from './api'
import type { CreateDatabaseInput, ImportOptions, UpdateDatabaseInput } from './types'

export const databaseKeys = {
  all: ['databases'] as const,
  detail: (id: string) => ['databases', id] as const,
  metrics: (id: string) => ['databases', id, 'metrics'] as const,
}

export function useDatabases() {
  return useQuery({ queryKey: databaseKeys.all, queryFn: getDatabases })
}

export function useDatabase(id: string | undefined) {
  return useQuery({
    queryKey: databaseKeys.detail(id ?? ''),
    queryFn: () => getDatabase(id!),
    enabled: Boolean(id),
  })
}

export function useCreateDatabase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDatabaseInput) => createDatabase(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: databaseKeys.all })
    },
  })
}

export function useDeleteDatabase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDatabase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: databaseKeys.all })
    },
  })
}

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
