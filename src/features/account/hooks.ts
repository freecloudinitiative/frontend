import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { generateApiKey, getAccount, revokeApiKey, updateAccountSettings } from './api'
import type { UpdateAccountSettingsInput } from './types'

export const accountKeys = {
  all: ['account'] as const,
}

export function useAccount(enabled = true) {
  return useQuery({ queryKey: accountKeys.all, queryFn: getAccount, enabled })
}

export function useUpdateAccountSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateAccountSettingsInput) => updateAccountSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
    },
  })
}

export function useGenerateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => generateApiKey(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (keyId: string) => revokeApiKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
    },
  })
}
