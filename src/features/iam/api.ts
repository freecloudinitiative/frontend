import apiClient from '@/lib/axios'
import type { CreateIamUserInput, IamActivityEntry, IamUser, IamUserWithPolicies, UpdateIamUserInput } from './types'

export async function getIamUsers(): Promise<IamUser[]> {
  const { data } = await apiClient.get<IamUser[]>('/api/iam/users')
  return data
}

export async function getIamUser(id: string): Promise<IamUserWithPolicies> {
  const { data } = await apiClient.get<IamUserWithPolicies>(`/api/iam/users/${id}`)
  return data
}

export async function createIamUser(input: CreateIamUserInput): Promise<IamUser> {
  const { data } = await apiClient.post<IamUser>('/api/iam/users', input)
  return data
}

export async function deleteIamUser(id: string): Promise<void> {
  await apiClient.delete(`/api/iam/users/${id}`)
}

export async function patchIamUser(id: string, partial: UpdateIamUserInput): Promise<IamUser> {
  const { data } = await apiClient.patch<IamUser>(`/api/iam/users/${id}`, partial)
  return data
}

export async function getIamUserActivity(id: string): Promise<IamActivityEntry[]> {
  const { data } = await apiClient.get<IamActivityEntry[]>(`/api/iam/users/${id}/activity`)
  return data
}

export async function updateIamUserSettings(id: string, settings: Record<string, unknown>): Promise<IamUser> {
  const { data } = await apiClient.patch<IamUser>(`/api/iam/users/${id}/settings`, settings)
  return data
}
