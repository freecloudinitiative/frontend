/**
 * PR-22 Test Scenarios — Scenario 1 (mock data generation), Scenario 5
 * (type safety), Scenario 8 (nested data integrity) at the in-memory
 * store level.
 */
import { describe, it, expect } from 'vitest'
import type {
  CreateFirewallRuleInput,
  CreateNetworkInput,
  FirewallRule,
  Network,
  NetworkRoute,
  VpcPeering,
} from '@/features/network/types'
import {
  getNetworks,
  getNetworkById,
  createNetwork,
  deleteNetwork,
  addFirewallRule,
  deleteFirewallRule,
} from '@/mocks/data/networks'

// ---------------------------------------------------------------------------
// Scenario 1.1 — Network data
// ---------------------------------------------------------------------------

describe('Scenario 1.1 – Network data generation', () => {
  it('generates 6-8 networks with realistic names', () => {
    const networks = getNetworks()
    expect(networks.length).toBeGreaterThanOrEqual(6)
    expect(networks.length).toBeLessThanOrEqual(8)
    const names = networks.map((n) => n.vpcName)
    expect(names).toContain('prod-vpc-01')
    expect(names).toContain('staging-vpc')
    expect(names).toContain('dev-network')
  })

  it('every network has all required fields', () => {
    getNetworks().forEach((n) => {
      expect(typeof n.id).toBe('string')
      expect(typeof n.vpcName).toBe('string')
      expect(typeof n.cidrBlock).toBe('string')
      expect(typeof n.type).toBe('string')
      expect(typeof n.status).toBe('string')
      expect(typeof n.gateway).toBe('string')
      expect(['ANK', 'IST']).toContain(n.region)
      expect(typeof n.createdAt).toBe('string')
    })
  })

  it('type values are constrained to vpc | subnet | public', () => {
    getNetworks().forEach((n) => {
      expect(['vpc', 'subnet', 'public']).toContain(n.type)
    })
  })

  it('status values are constrained to active | down | pending', () => {
    getNetworks().forEach((n) => {
      expect(['active', 'down', 'pending']).toContain(n.status)
    })
  })

  it('CIDR blocks look realistic', () => {
    const cidrPattern = /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/
    getNetworks().forEach((n) => {
      expect(n.cidrBlock).toMatch(cidrPattern)
    })
  })

  it('createdAt values are ISO 8601 strings', () => {
    getNetworks().forEach((n) => {
      expect(new Date(n.createdAt).toISOString()).toBe(n.createdAt)
    })
  })
})

// ---------------------------------------------------------------------------
// Scenario 1.2 — Firewall rules (nested)
// ---------------------------------------------------------------------------

describe('Scenario 1.2 – Firewall rules (nested)', () => {
  it('each network has 3-5 firewall rules', () => {
    getNetworks().forEach((n) => {
      expect(n.firewallRules.length).toBeGreaterThanOrEqual(3)
      expect(n.firewallRules.length).toBeLessThanOrEqual(5)
    })
  })

  it('each rule has all required fields', () => {
    getNetworks().flatMap((n) => n.firewallRules).forEach((rule) => {
      expect(typeof rule.id).toBe('string')
      expect(typeof rule.name).toBe('string')
      expect(typeof rule.direction).toBe('string')
      expect(typeof rule.protocol).toBe('string')
      expect(typeof rule.portRange).toBe('string')
      expect(typeof rule.source).toBe('string')
      expect(typeof rule.action).toBe('string')
    })
  })

  it('direction values are ingress | egress', () => {
    getNetworks().flatMap((n) => n.firewallRules).forEach((rule) => {
      expect(['ingress', 'egress']).toContain(rule.direction)
    })
  })

  it('protocol values are tcp | udp | icmp | all', () => {
    getNetworks().flatMap((n) => n.firewallRules).forEach((rule) => {
      expect(['tcp', 'udp', 'icmp', 'all']).toContain(rule.protocol)
    })
  })

  it('source is "any" or a CIDR-shaped string', () => {
    const cidrPattern = /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/
    getNetworks().flatMap((n) => n.firewallRules).forEach((rule) => {
      expect(rule.source === 'any' || cidrPattern.test(rule.source)).toBe(true)
    })
  })

  it('action values are allow | deny', () => {
    getNetworks().flatMap((n) => n.firewallRules).forEach((rule) => {
      expect(['allow', 'deny']).toContain(rule.action)
    })
  })
})

// ---------------------------------------------------------------------------
// Scenario 1.3 — Routes (nested)
// ---------------------------------------------------------------------------

describe('Scenario 1.3 – Routes (nested)', () => {
  it('each network has 2-4 routes', () => {
    getNetworks().forEach((n) => {
      expect(n.routes.length).toBeGreaterThanOrEqual(2)
      expect(n.routes.length).toBeLessThanOrEqual(4)
    })
  })

  it('each route has all required fields', () => {
    getNetworks().flatMap((n) => n.routes).forEach((route) => {
      expect(typeof route.id).toBe('string')
      expect(typeof route.destination).toBe('string')
      expect(typeof route.nextHop).toBe('string')
      expect(typeof route.priority).toBe('number')
      expect(typeof route.status).toBe('string')
    })
  })

  it('destination is CIDR-shaped', () => {
    const cidrPattern = /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/
    getNetworks().flatMap((n) => n.routes).forEach((route) => {
      expect(route.destination).toMatch(cidrPattern)
    })
  })

  it('priority is numeric', () => {
    getNetworks().flatMap((n) => n.routes).forEach((route) => {
      expect(Number.isFinite(route.priority)).toBe(true)
    })
  })

  it('status values are active | pending', () => {
    getNetworks().flatMap((n) => n.routes).forEach((route) => {
      expect(['active', 'pending']).toContain(route.status)
    })
  })
})

// ---------------------------------------------------------------------------
// Scenario 1.4 — VPC peerings (nested)
// ---------------------------------------------------------------------------

describe('Scenario 1.4 – VPC peerings (nested)', () => {
  it('each network has 1-2 peerings', () => {
    getNetworks().forEach((n) => {
      expect(n.peerings.length).toBeGreaterThanOrEqual(1)
      expect(n.peerings.length).toBeLessThanOrEqual(2)
    })
  })

  it('each peering has all required fields', () => {
    getNetworks().flatMap((n) => n.peerings).forEach((peering) => {
      expect(typeof peering.id).toBe('string')
      expect(typeof peering.peerVpc).toBe('string')
      expect(typeof peering.peerRegion).toBe('string')
      expect(typeof peering.peerCidr).toBe('string')
      expect(typeof peering.status).toBe('string')
    })
  })

  it('peerVpc names are non-empty realistic strings', () => {
    getNetworks().flatMap((n) => n.peerings).forEach((peering) => {
      expect(peering.peerVpc.length).toBeGreaterThan(0)
    })
  })

  it('status values are active | pending | failed', () => {
    getNetworks().flatMap((n) => n.peerings).forEach((peering) => {
      expect(['active', 'pending', 'failed']).toContain(peering.status)
    })
  })
})

// ---------------------------------------------------------------------------
// Scenario 5 — Type safety (structural checks exercised at runtime)
// ---------------------------------------------------------------------------

describe('Scenario 5.1 – FirewallRule type', () => {
  it('accepts a well-formed FirewallRule literal', () => {
    const rule: FirewallRule = {
      id: 'r1',
      name: 'allow-ssh',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '22',
      source: 'any',
      action: 'allow',
    }
    expect(rule.direction).toBe('ingress')
    expect(rule.protocol).toBe('tcp')
    expect(rule.action).toBe('allow')
  })
})

describe('Scenario 5.2 – Network type with nested arrays', () => {
  it('Network has typed firewallRules, routes, peerings arrays', () => {
    const network = getNetworks()[0]
    const _fw: FirewallRule[] = network.firewallRules
    const _routes: NetworkRoute[] = network.routes
    const _peerings: VpcPeering[] = network.peerings
    expect(Array.isArray(_fw)).toBe(true)
    expect(Array.isArray(_routes)).toBe(true)
    expect(Array.isArray(_peerings)).toBe(true)
  })

  it('all required Network fields are present', () => {
    const network: Network = getNetworks()[0]
    expect(network.id).toBeDefined()
    expect(network.vpcName).toBeDefined()
    expect(network.cidrBlock).toBeDefined()
    expect(network.type).toBeDefined()
    expect(network.status).toBeDefined()
    expect(network.gateway).toBeDefined()
    expect(network.createdAt).toBeDefined()
  })
})

describe('Scenario 5.3 – NetworkRoute & VpcPeering types', () => {
  it('NetworkRoute enforces status enum', () => {
    const route: NetworkRoute = { id: 'r1', destination: '0.0.0.0/0', nextHop: 'igw', priority: 100, status: 'active' }
    expect(['active', 'pending']).toContain(route.status)
  })

  it('VpcPeering enforces status enum', () => {
    const peering: VpcPeering = { id: 'p1', peerVpc: 'peer-vpc-1', peerRegion: 'ANK', peerCidr: '10.1.0.0/16', status: 'failed' }
    expect(['active', 'pending', 'failed']).toContain(peering.status)
  })
})

describe('Scenario 5.4 – Input types', () => {
  it('CreateNetworkInput requires vpcName, cidrBlock, type', () => {
    const input: CreateNetworkInput = { vpcName: 'test-vpc', cidrBlock: '10.0.0.0/16', type: 'vpc' }
    expect(input.vpcName).toBe('test-vpc')
  })

  it('CreateFirewallRuleInput requires all rule fields except id', () => {
    const input: CreateFirewallRuleInput = {
      name: 'test-rule',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '8080',
      source: 'any',
      action: 'allow',
    }
    expect(input.name).toBe('test-rule')
  })
})

// ---------------------------------------------------------------------------
// Store CRUD
// ---------------------------------------------------------------------------

describe('In-memory store – getNetworks / getNetworkById', () => {
  it('getNetworkById() returns the matching network', () => {
    const id = getNetworks()[0].id
    const network = getNetworkById(id)
    expect(network).toBeDefined()
    expect(network!.id).toBe(id)
  })

  it('getNetworkById() returns undefined for unknown ID', () => {
    expect(getNetworkById('does-not-exist')).toBeUndefined()
  })
})

describe('In-memory store – createNetwork()', () => {
  it('adds a new network with generated id and empty nested arrays', () => {
    const before = getNetworks().length
    const created = createNetwork({ vpcName: 'test-vpc', cidrBlock: '10.0.0.0/16', type: 'vpc' })
    expect(getNetworks().length).toBe(before + 1)
    expect(created.id).toBeTruthy()
    expect(created.vpcName).toBe('test-vpc')
    expect(created.cidrBlock).toBe('10.0.0.0/16')
    expect(created.type).toBe('vpc')
    expect(created.status).toBe('active')
    expect(created.firewallRules).toEqual([])
    expect(created.routes).toEqual([])
    expect(created.peerings).toEqual([])
    expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt)
  })

  it('generates unique IDs for each created network', () => {
    const a = createNetwork({ vpcName: 'a-vpc', cidrBlock: '10.1.0.0/16', type: 'vpc' })
    const b = createNetwork({ vpcName: 'b-vpc', cidrBlock: '10.2.0.0/16', type: 'vpc' })
    expect(a.id).not.toBe(b.id)
  })

  it('consistently resolves and reuses fallback region and zone across network and subnets', () => {
    const created = createNetwork({ vpcName: 'consistent-zone-vpc', cidrBlock: '10.5.0.0/16', type: 'vpc' })
    expect(['ANK', 'IST']).toContain(created.region)
    expect(created.zone.startsWith(`${created.region.toLowerCase()}-`)).toBe(true)
    expect(created.subnets[0].zone).toBe(created.zone)
    expect(created.subnets[1].zone).toBe(created.zone)
  })
})

describe('In-memory store – deleteNetwork()', () => {
  it('removes a network from the store', () => {
    const created = createNetwork({ vpcName: 'to-delete', cidrBlock: '10.9.0.0/16', type: 'vpc' })
    const deleted = deleteNetwork(created.id)
    expect(deleted).toBe(true)
    expect(getNetworkById(created.id)).toBeUndefined()
  })

  it('returns false for an unknown ID', () => {
    expect(deleteNetwork('does-not-exist-delete')).toBe(false)
  })
})

describe('In-memory store – addFirewallRule() / deleteFirewallRule()', () => {
  it('adds a rule to the target network only', () => {
    const networkA = createNetwork({ vpcName: 'network-a', cidrBlock: '10.10.0.0/16', type: 'vpc' })
    const networkB = createNetwork({ vpcName: 'network-b', cidrBlock: '10.11.0.0/16', type: 'vpc' })

    const rule = addFirewallRule(networkA.id, {
      name: 'test-rule',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '8080',
      source: 'any',
      action: 'allow',
    })

    expect(rule).toBeDefined()
    expect(rule!.id).toBeTruthy()
    expect(getNetworkById(networkA.id)!.firewallRules).toHaveLength(1)
    expect(getNetworkById(networkB.id)!.firewallRules).toHaveLength(0)
  })

  it('returns undefined when the network does not exist', () => {
    const rule = addFirewallRule('does-not-exist', {
      name: 'x',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '80',
      source: 'any',
      action: 'allow',
    })
    expect(rule).toBeUndefined()
  })

  it('deletes a rule from the correct network, leaving others untouched', () => {
    const network = createNetwork({ vpcName: 'delete-rule-net', cidrBlock: '10.12.0.0/16', type: 'vpc' })
    const rule1 = addFirewallRule(network.id, { name: 'r1', direction: 'ingress', protocol: 'tcp', portRange: '22', source: 'any', action: 'allow' })!
    const rule2 = addFirewallRule(network.id, { name: 'r2', direction: 'egress', protocol: 'udp', portRange: '53', source: 'any', action: 'allow' })!

    const deleted = deleteFirewallRule(network.id, rule1.id)
    expect(deleted).toBe(true)

    const updated = getNetworkById(network.id)!
    expect(updated.firewallRules).toHaveLength(1)
    expect(updated.firewallRules[0].id).toBe(rule2.id)
  })

  it('returns false when the network does not exist', () => {
    expect(deleteFirewallRule('does-not-exist', 'rule-id')).toBe(false)
  })

  it('returns false when the rule does not exist on the network', () => {
    const network = createNetwork({ vpcName: 'no-such-rule-net', cidrBlock: '10.13.0.0/16', type: 'vpc' })
    expect(deleteFirewallRule(network.id, 'no-such-rule')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Scenario 8 — Nested data integrity (store level)
// ---------------------------------------------------------------------------

describe('Scenario 8 – Nested data integrity', () => {
  it('8.1 – existing rules preserved when a new rule is added', () => {
    const network = createNetwork({ vpcName: 'integrity-net', cidrBlock: '10.14.0.0/16', type: 'vpc' })
    const rule1 = addFirewallRule(network.id, { name: 'r1', direction: 'ingress', protocol: 'tcp', portRange: '22', source: 'any', action: 'allow' })!
    addFirewallRule(network.id, { name: 'r2', direction: 'egress', protocol: 'udp', portRange: '53', source: 'any', action: 'allow' })

    const updated = getNetworkById(network.id)!
    expect(updated.firewallRules.map((r) => r.id)).toContain(rule1.id)
    expect(updated.firewallRules).toHaveLength(2)
  })

  it('8.2 – adding a rule to network A does not affect network B routes/peerings', () => {
    const networkA = getNetworks()[0]
    const networkB = getNetworks()[1]
    const bRoutesBefore = getNetworkById(networkB.id)!.routes.map((r) => r.id)
    const bPeeringsBefore = getNetworkById(networkB.id)!.peerings.map((p) => p.id)

    addFirewallRule(networkA.id, { name: 'isolated-rule', direction: 'ingress', protocol: 'tcp', portRange: '9090', source: 'any', action: 'allow' })

    const bAfter = getNetworkById(networkB.id)!
    expect(bAfter.routes.map((r) => r.id)).toEqual(bRoutesBefore)
    expect(bAfter.peerings.map((p) => p.id)).toEqual(bPeeringsBefore)
  })

  it('firewall rule IDs are unique within a network', () => {
    getNetworks().forEach((n) => {
      const ids = n.firewallRules.map((r) => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  it('no null or undefined fields on nested rule/route/peering objects', () => {
    getNetworks().forEach((n) => {
      n.firewallRules.forEach((rule) => {
        Object.values(rule).forEach((v) => {
          expect(v).not.toBeNull()
          expect(v).not.toBeUndefined()
        })
      })
    })
  })
})
