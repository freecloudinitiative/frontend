import { createResourceApi } from '@/lib/apiResource'
import apiClient from '@/lib/axios'
import type { CreateIamUserInput, IamActivityEntry, IamUser, IamUserWithPolicies, UpdateIamUserInput } from './types'

const resource = createResourceApi<IamUser, CreateIamUserInput, UpdateIamUserInput>('/api/iam/users')

export const getIamUsers = resource.list
export const createIamUser = resource.create
export const deleteIamUser = resource.remove
export const patchIamUser = resource.patch
export const updateIamUserSettings = resource.updateSettings

export async function getIamUser(id: string): Promise<IamUserWithPolicies> {
  const { data } = await apiClient.get<IamUserWithPolicies>(`/api/iam/users/${id}`)
  return data
}

export async function getIamUserActivity(id: string): Promise<IamActivityEntry[]> {
  const { data } = await apiClient.get<IamActivityEntry[]>(`/api/iam/users/${id}/activity`)
  return data
}
