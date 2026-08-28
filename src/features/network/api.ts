import { createResourceApi } from '@/lib/apiResource'
import apiClient from '@/lib/axios'
import type { CreateFirewallRuleInput, CreateNetworkInput, FirewallRule, Network, UpdateNetworkSettingsInput } from './types'

const resource = createResourceApi<Network, CreateNetworkInput, UpdateNetworkSettingsInput>('/api/networks')

export const getNetworks = resource.list
export const getNetwork = resource.get
export const createNetwork = resource.create
export const deleteNetwork = resource.remove
export const updateNetworkSettings = resource.updateSettings

export async function getFirewallRules(networkId: string): Promise<FirewallRule[]> {
  const { data } = await apiClient.get<FirewallRule[]>(`/api/networks/${networkId}/firewall-rules`)
  return data
}

export async function addFirewallRule(networkId: string, input: CreateFirewallRuleInput): Promise<FirewallRule> {
  const { data } = await apiClient.post<FirewallRule>(`/api/networks/${networkId}/firewall-rules`, input)
  return data
}

export async function deleteFirewallRule(networkId: string, ruleId: string): Promise<void> {
  await apiClient.delete(`/api/networks/${networkId}/firewall-rules/${ruleId}`)
}
