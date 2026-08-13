import { createResourceApi } from '@/lib/apiResource'
import apiClient from '@/lib/axios'
import type {
  CreateDatabaseInput,
  Database,
  DatabaseMetricPoint,
  ImportOptions,
  ImportResult,
  SqlExecutionResult,
  UpdateDatabaseInput,
} from './types'

const resource = createResourceApi<Database, CreateDatabaseInput, UpdateDatabaseInput>('/api/databases')

export const getDatabases = resource.list
export const getDatabase = resource.get
export const createDatabase = resource.create
export const deleteDatabase = resource.remove
export const patchDatabase = resource.patch
export const updateDatabaseSettings = resource.updateSettings

export async function getDatabaseMetrics(id: string): Promise<DatabaseMetricPoint[]> {
  const { data } = await apiClient.get<DatabaseMetricPoint[]>(`/api/databases/${id}/metrics`)
  return data
}

export async function executeSqlScript(id: string, script: string): Promise<SqlExecutionResult> {
  const { data } = await apiClient.post<SqlExecutionResult>(`/api/databases/${id}/execute-sql`, { script })
  return data
}

export async function importData(id: string, file: File, options: ImportOptions): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('options', JSON.stringify(options))
  // Content-Type is intentionally left unset — axios auto-generates the
  // multipart boundary for FormData bodies; a hardcoded header here would
  // omit the boundary and produce an unparseable request.
  const { data } = await apiClient.post<ImportResult>(`/api/databases/${id}/import-data`, formData)
  return data
}
