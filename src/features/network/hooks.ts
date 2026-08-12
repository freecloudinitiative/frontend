import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addFirewallRule,
  createNetwork,
  deleteFirewallRule,
  deleteNetwork,
  getFirewallRules,
  getNetwork,
  getNetworks,
} from './api'
import type { CreateFirewallRuleInput, CreateNetworkInput } from './types'

export const networkKeys = {
  all: ['networks'] as const,
  detail: (id: string) => ['networks', id] as const,
  firewallRules: (id: string) => ['networks', id, 'firewall-rules'] as const,
}

export function useNetworks() {
  return useQuery({ queryKey: networkKeys.all, queryFn: getNetworks })
}

export function useNetwork(id: string | undefined) {
  return useQuery({
    queryKey: networkKeys.detail(id ?? ''),
    queryFn: () => getNetwork(id!),
    enabled: Boolean(id),
  })
}

export function useCreateNetwork() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateNetworkInput) => createNetwork(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.all })
    },
  })
}

export function useDeleteNetwork() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNetwork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.all })
    },
  })
}

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
