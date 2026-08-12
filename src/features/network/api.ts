import apiClient from '@/lib/axios'
import type { CreateFirewallRuleInput, CreateNetworkInput, FirewallRule, Network } from './types'

export async function getNetworks(): Promise<Network[]> {
  const { data } = await apiClient.get<Network[]>('/api/networks')
  return data
}

export async function getNetwork(id: string): Promise<Network> {
  const { data } = await apiClient.get<Network>(`/api/networks/${id}`)
  return data
}

export async function getFirewallRules(networkId: string): Promise<FirewallRule[]> {
  const { data } = await apiClient.get<FirewallRule[]>(`/api/networks/${networkId}/firewall-rules`)
  return data
}

export async function createNetwork(input: CreateNetworkInput): Promise<Network> {
  const { data } = await apiClient.post<Network>('/api/networks', input)
  return data
}

export async function deleteNetwork(id: string): Promise<void> {
  await apiClient.delete(`/api/networks/${id}`)
}

export async function addFirewallRule(networkId: string, input: CreateFirewallRuleInput): Promise<FirewallRule> {
  const { data } = await apiClient.post<FirewallRule>(`/api/networks/${networkId}/firewall-rules`, input)
  return data
}

export async function deleteFirewallRule(networkId: string, ruleId: string): Promise<void> {
  await apiClient.delete(`/api/networks/${networkId}/firewall-rules/${ruleId}`)
}
