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

export async function getDatabases(): Promise<Database[]> {
  const { data } = await apiClient.get<Database[]>('/api/databases')
  return data
}

export async function getDatabase(id: string): Promise<Database> {
  const { data } = await apiClient.get<Database>(`/api/databases/${id}`)
  return data
}

export async function createDatabase(input: CreateDatabaseInput): Promise<Database> {
  const { data } = await apiClient.post<Database>('/api/databases', input)
  return data
}

export async function deleteDatabase(id: string): Promise<void> {
  await apiClient.delete(`/api/databases/${id}`)
}

export async function patchDatabase(id: string, partial: UpdateDatabaseInput): Promise<Database> {
  const { data } = await apiClient.patch<Database>(`/api/databases/${id}`, partial)
  return data
}

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
