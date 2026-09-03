import apiClient from '@/lib/axios'
import type { AccountSettings, GenerateApiKeyResult, UpdateAccountSettingsInput } from './types'

const ACCOUNT_REQUEST_TIMEOUT_MS = 15_000

export async function getAccount(): Promise<AccountSettings> {
  const { data } = await apiClient.get<AccountSettings>('/api/account', {
    timeout: ACCOUNT_REQUEST_TIMEOUT_MS,
  })
  return data
}

export async function updateAccountSettings(input: UpdateAccountSettingsInput): Promise<AccountSettings> {
  const { data } = await apiClient.patch<AccountSettings>('/api/account/settings', input)
  return data
}

export async function generateApiKey(name: string): Promise<GenerateApiKeyResult> {
  const { data } = await apiClient.post<GenerateApiKeyResult>('/api/account/api-keys', { name })
  return data
}

export async function revokeApiKey(keyId: string): Promise<{ apiKeys: AccountSettings['apiKeys'] }> {
  const { data } = await apiClient.delete<{ apiKeys: AccountSettings['apiKeys'] }>(`/api/account/api-keys/${keyId}`)
  return data
}
