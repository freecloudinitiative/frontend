import apiClient from '@/lib/axios'
import type { CreateDatabaseInput, Database, DatabaseMetricPoint, UpdateDatabaseInput } from './types'

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
