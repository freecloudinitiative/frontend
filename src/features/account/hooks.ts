import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { generateApiKey, getAccount, revokeApiKey, updateAccountSettings } from './api'
import type { UpdateAccountSettingsInput } from './types'

export const accountKeys = {
  all: ['account'] as const,
  bySubject: (subject: string) => [...accountKeys.all, subject] as const,
}

export function useAccount(subject = 'current', enabled = true) {
  return useQuery({ queryKey: accountKeys.bySubject(subject), queryFn: getAccount, enabled })
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
