/**
 * PR-22 Test Scenarios — axios API layer (features/network/api.ts).
 * Verifies each function calls the correct endpoint and returns the
 * correctly-typed response, backed by the MSW Node server.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'
import { getNetworks as getMockNetworks } from '@/mocks/data/networks'
import {
  getNetworks,
  getNetwork,
  createNetwork,
  deleteNetwork,
  addFirewallRule,
  deleteFirewallRule,
} from '@/features/network/api'
import type { FirewallRule, Network } from '@/features/network/types'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Network API layer', () => {
  it('getNetworks() returns array of Network with nested arrays', async () => {
    const networks: Network[] = await getNetworks()
    expect(Array.isArray(networks)).toBe(true)
    expect(networks.length).toBeGreaterThanOrEqual(6)
    const n = networks[0]
    expect(typeof n.id).toBe('string')
    expect(Array.isArray(n.firewallRules)).toBe(true)
    expect(Array.isArray(n.routes)).toBe(true)
    expect(Array.isArray(n.peerings)).toBe(true)
  })

  it('getNetwork(id) returns the matching Network', async () => {
    const id = getMockNetworks()[0].id
    const network: Network = await getNetwork(id)
    expect(network.id).toBe(id)
  })

  it('getNetwork() throws for an unknown ID', async () => {
    await expect(getNetwork('does-not-exist-api')).rejects.toThrow()
  })

  it('createNetwork() sends payload and returns the new Network', async () => {
    const input = { vpcName: 'api-vpc', cidrBlock: '10.40.0.0/16', type: 'vpc' as const, region: 'IST' as const }
    const network: Network = await createNetwork(input)
    expect(typeof network.id).toBe('string')
    expect(network.vpcName).toBe(input.vpcName)
    expect(network.cidrBlock).toBe(input.cidrBlock)
    expect(network.type).toBe(input.type)
    expect(network.firewallRules).toEqual([])
  })

  it('deleteNetwork() resolves without throwing for an existing network', async () => {
    const created = await createNetwork({ vpcName: 'del-api-vpc', cidrBlock: '10.41.0.0/16', type: 'vpc', region: 'IST' })
    await expect(deleteNetwork(created.id)).resolves.toBeUndefined()
  })

  it('deleteNetwork() throws for an unknown ID', async () => {
    await expect(deleteNetwork('does-not-exist-delete-api')).rejects.toThrow()
  })

  it('addFirewallRule() sends the rule and returns it with a generated id', async () => {
    const networks = await getNetworks()
    const id = networks[0].id
    const rule: FirewallRule = await addFirewallRule(id, {
      name: 'api-rule',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '8080',
      source: 'any',
      action: 'allow',
    })
    expect(typeof rule.id).toBe('string')
    expect(rule.name).toBe('api-rule')
  })

  it('addFirewallRule() throws for an unknown network', async () => {
    await expect(
      addFirewallRule('does-not-exist-rule-api', {
        name: 'x',
        direction: 'ingress',
        protocol: 'tcp',
        portRange: '80',
        source: 'any',
        action: 'allow',
      }),
    ).rejects.toThrow()
  })

  it('deleteFirewallRule() resolves without throwing for an existing rule', async () => {
    const networks = await getNetworks()
    const id = networks[1].id
    const rule = await addFirewallRule(id, {
      name: 'to-remove',
      direction: 'egress',
      protocol: 'udp',
      portRange: '53',
      source: 'any',
      action: 'allow',
    })
    await expect(deleteFirewallRule(id, rule.id)).resolves.toBeUndefined()
  })

  it('deleteFirewallRule() throws for an unknown rule', async () => {
    const networks = await getNetworks()
    const id = networks[0].id
    await expect(deleteFirewallRule(id, 'does-not-exist-rule')).rejects.toThrow()
  })
})
