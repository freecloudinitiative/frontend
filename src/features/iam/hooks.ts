import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createIamUser, deleteIamUser, getIamUser, getIamUserActivity, getIamUsers, patchIamUser } from './api'
import type { CreateIamUserInput, UpdateIamUserInput } from './types'

export const iamKeys = {
  all: ['iam-users'] as const,
  detail: (id: string) => ['iam-users', id] as const,
  activity: (id: string) => ['iam-users', id, 'activity'] as const,
}

export function useIamUsers() {
  return useQuery({ queryKey: iamKeys.all, queryFn: getIamUsers })
}

export function useIamUser(id: string | undefined) {
  return useQuery({
    queryKey: iamKeys.detail(id ?? ''),
    queryFn: () => getIamUser(id!),
    enabled: Boolean(id),
  })
}

export function useCreateIamUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateIamUserInput) => createIamUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iamKeys.all })
    },
  })
}

export function useDeleteIamUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteIamUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iamKeys.all })
    },
  })
}

export function useUpdateIamUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, partial }: { id: string; partial: UpdateIamUserInput }) =>
      patchIamUser(id, partial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iamKeys.all })
    },
  })
}

export function useIamUserActivity(id: string | undefined) {
  return useQuery({
    queryKey: iamKeys.activity(id ?? ''),
    queryFn: () => getIamUserActivity(id!),
    enabled: Boolean(id),
  })
}
