import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createResourceHooks, createResourceKeys } from '@/lib/queryFactory'
import {
  addFirewallRule,
  createNetwork,
  deleteFirewallRule,
  deleteNetwork,
  getFirewallRules,
  getNetwork,
  getNetworks,
  updateNetworkSettings,
} from './api'
import type { CreateFirewallRuleInput, CreateNetworkInput } from './types'

export const networkKeys = {
  ...createResourceKeys('networks'),
  firewallRules: (id: string) => ['networks', id, 'firewall-rules'] as const,
}

const resourceHooks = createResourceHooks<
  Awaited<ReturnType<typeof getNetwork>>,
  Awaited<ReturnType<typeof getNetwork>>,
  CreateNetworkInput
>({
  keys: networkKeys,
  list: getNetworks,
  get: getNetwork,
  create: createNetwork,
  remove: deleteNetwork,
  updateSettings: updateNetworkSettings,
})

export const useNetworks = resourceHooks.useList
export const useNetwork = resourceHooks.useDetail
export const useCreateNetwork = resourceHooks.useCreate
export const useDeleteNetwork = resourceHooks.useRemove
export const useUpdateNetworkSettings = resourceHooks.useUpdateSettings

export function useAddFirewallRule(networkId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateFirewallRuleInput) => addFirewallRule(networkId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.detail(networkId) })
      queryClient.invalidateQueries({ queryKey: networkKeys.firewallRules(networkId) })
      queryClient.invalidateQueries({ queryKey: networkKeys.all })
    },
  })
}

export function useDeleteFirewallRule(networkId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => deleteFirewallRule(networkId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.detail(networkId) })
      queryClient.invalidateQueries({ queryKey: networkKeys.firewallRules(networkId) })
      queryClient.invalidateQueries({ queryKey: networkKeys.all })
    },
  })
}

export function useFirewallRules(networkId: string | undefined) {
  return useQuery({
    queryKey: networkKeys.firewallRules(networkId ?? ''),
    queryFn: () => getFirewallRules(networkId!),
    enabled: Boolean(networkId),
  })
}
