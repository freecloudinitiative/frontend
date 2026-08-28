import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createResourceHooks, createResourceKeys } from '@/lib/queryFactory'
import {
  createIamUser,
  deleteIamUser,
  getIamUser,
  getIamUserActivity,
  getIamUsers,
  patchIamUser,
  updateIamUserSettings,
} from './api'
import type { CreateIamUserInput, UpdateIamUserInput } from './types'

export const iamKeys = {
  ...createResourceKeys('iam-users'),
  activity: (id: string) => ['iam-users', id, 'activity'] as const,
}

const resourceHooks = createResourceHooks<
  Awaited<ReturnType<typeof getIamUsers>>[number],
  Awaited<ReturnType<typeof getIamUser>>,
  CreateIamUserInput,
  UpdateIamUserInput
>({
  keys: iamKeys,
  list: getIamUsers,
  get: getIamUser,
  create: createIamUser,
  remove: deleteIamUser,
  updateSettings: updateIamUserSettings,
})

export const useIamUsers = resourceHooks.useList
export const useIamUser = resourceHooks.useDetail
export const useCreateIamUser = resourceHooks.useCreate
export const useDeleteIamUser = resourceHooks.useRemove
export const useUpdateIamSettings = resourceHooks.useUpdateSettings

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

export function useIamUserActivity(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: iamKeys.activity(id ?? ''),
    queryFn: () => getIamUserActivity(id!),
    enabled: Boolean(id) && enabled,
  })
}
