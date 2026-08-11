import { faker } from '@faker-js/faker'
import type {
  CreateFirewallRuleInput,
  CreateNetworkInput,
  FirewallRule,
  Network,
  NetworkRoute,
  Region,
  VpcPeering,
} from '@/features/network/types'

faker.seed(22)

const REGIONS: readonly Region[] = ['ANK', 'IST']

const FIREWALL_RULE_NAMES = ['allow-ssh', 'allow-http', 'allow-https', 'deny-all-inbound', 'allow-internal'] as const
const PORT_RANGES = ['22', '80', '443', '80,443', '3000-4000', 'all'] as const
const ROUTE_DESTINATIONS = ['0.0.0.0/0', '10.0.0.0/8', '172.16.0.0/12'] as const
const ROUTE_NEXT_HOPS = ['internet-gateway', 'nat-gateway', '10.0.0.1', 'peering-connection'] as const
const CIDR_BLOCKS = ['10.0.0.0/16', '10.128.0.0/20', '172.16.0.0/12', '10.32.0.0/16', '10.64.0.0/20', '192.168.0.0/16'] as const

// ---------------------------------------------------------------------------
// Nested-resource generation helpers
// ---------------------------------------------------------------------------

function generateFirewallRule(): FirewallRule {
  const direction = faker.helpers.arrayElement(['ingress', 'egress'] as const)
  const action = faker.helpers.weightedArrayElement([
    { value: 'allow' as const, weight: 8 },
    { value: 'deny' as const, weight: 2 },
  ])
  return {
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(FIREWALL_RULE_NAMES),
    direction,
    protocol: faker.helpers.arrayElement(['tcp', 'udp', 'icmp', 'all'] as const),
    portRange: faker.helpers.arrayElement(PORT_RANGES),
    source: faker.helpers.weightedArrayElement([
      { value: 'any', weight: 3 },
      { value: `10.0.${faker.number.int({ min: 0, max: 255 })}.0/24`, weight: 7 },
    ]),
    action,
  }
}

function generateRoute(): NetworkRoute {
  return {
    id: faker.string.uuid(),
    destination: faker.helpers.arrayElement(ROUTE_DESTINATIONS),
    nextHop: faker.helpers.arrayElement(ROUTE_NEXT_HOPS),
    priority: faker.number.int({ min: 100, max: 1000 }),
    status: faker.helpers.weightedArrayElement([
      { value: 'active' as const, weight: 9 },
      { value: 'pending' as const, weight: 1 },
    ]),
  }
}

function generatePeering(): VpcPeering {
  return {
    id: faker.string.uuid(),
    peerVpc: `peer-vpc-${faker.number.int({ min: 1, max: 99 })}`,
    peerRegion: faker.helpers.arrayElement(REGIONS),
    peerCidr: `10.${faker.number.int({ min: 1, max: 254 })}.0.0/16`,
    status: faker.helpers.weightedArrayElement([
      { value: 'active' as const, weight: 7 },
      { value: 'pending' as const, weight: 2 },
      { value: 'failed' as const, weight: 1 },
    ]),
  }
}

function generateNetwork(): Network {
  return {
    id: faker.string.uuid(),
    vpcName: `${faker.word.noun()}-vpc-${faker.number.int({ min: 1, max: 99 })}`,
    cidrBlock: faker.helpers.arrayElement(CIDR_BLOCKS),
    type: faker.helpers.weightedArrayElement([
      { value: 'vpc' as const, weight: 6 },
      { value: 'subnet' as const, weight: 3 },
      { value: 'public' as const, weight: 1 },
    ]),
    status: faker.helpers.weightedArrayElement([
      { value: 'active' as const, weight: 8 },
      { value: 'pending' as const, weight: 1 },
      { value: 'down' as const, weight: 1 },
    ]),
    gateway: `10.${faker.number.int({ min: 0, max: 254 })}.0.1`,
    region: faker.helpers.arrayElement(REGIONS),
    firewallRules: Array.from({ length: faker.number.int({ min: 3, max: 5 }) }, generateFirewallRule),
    routes: Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, generateRoute),
    peerings: Array.from({ length: faker.number.int({ min: 1, max: 2 }) }, generatePeering),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Mutable in-memory store
// ---------------------------------------------------------------------------

const SEED_DATA: Network[] = [
  {
    id: faker.string.uuid(),
    vpcName: 'prod-vpc-01',
    cidrBlock: '10.0.0.0/16',
    type: 'vpc',
    status: 'active',
    gateway: '10.0.0.1',
    region: 'ANK',
    firewallRules: [
      { id: faker.string.uuid(), name: 'allow-ssh', direction: 'ingress', protocol: 'tcp', portRange: '22', source: '10.0.1.0/24', action: 'allow' },
      { id: faker.string.uuid(), name: 'allow-https', direction: 'ingress', protocol: 'tcp', portRange: '443', source: 'any', action: 'allow' },
      { id: faker.string.uuid(), name: 'allow-http', direction: 'ingress', protocol: 'tcp', portRange: '80', source: 'any', action: 'allow' },
      { id: faker.string.uuid(), name: 'deny-all-inbound', direction: 'ingress', protocol: 'all', portRange: 'all', source: 'any', action: 'deny' },
    ],
    routes: [
      { id: faker.string.uuid(), destination: '0.0.0.0/0', nextHop: 'internet-gateway', priority: 100, status: 'active' },
      { id: faker.string.uuid(), destination: '10.0.0.0/8', nextHop: '10.0.0.1', priority: 200, status: 'active' },
    ],
    peerings: [
      { id: faker.string.uuid(), peerVpc: 'staging-vpc', peerRegion: 'IST', peerCidr: '10.128.0.0/20', status: 'active' },
    ],
    createdAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: faker.string.uuid(),
    vpcName: 'staging-vpc',
    cidrBlock: '10.128.0.0/20',
    type: 'vpc',
    status: 'active',
    gateway: '10.128.0.1',
    region: 'IST',
    firewallRules: [
      { id: faker.string.uuid(), name: 'allow-ssh', direction: 'ingress', protocol: 'tcp', portRange: '22', source: '10.128.1.0/24', action: 'allow' },
      { id: faker.string.uuid(), name: 'allow-internal', direction: 'ingress', protocol: 'all', portRange: 'all', source: '10.128.0.0/20', action: 'allow' },
      { id: faker.string.uuid(), name: 'deny-all-inbound', direction: 'ingress', protocol: 'all', portRange: 'all', source: 'any', action: 'deny' },
    ],
    routes: [
      { id: faker.string.uuid(), destination: '0.0.0.0/0', nextHop: 'internet-gateway', priority: 100, status: 'active' },
      { id: faker.string.uuid(), destination: '10.0.0.0/8', nextHop: 'peering-connection', priority: 300, status: 'pending' },
    ],
    peerings: [
      { id: faker.string.uuid(), peerVpc: 'prod-vpc-01', peerRegion: 'ANK', peerCidr: '10.0.0.0/16', status: 'active' },
    ],
    createdAt: new Date('2024-02-14').toISOString(),
  },
  {
    id: faker.string.uuid(),
    vpcName: 'dev-network',
    cidrBlock: '172.16.0.0/12',
    type: 'subnet',
    status: 'pending',
    gateway: '172.16.0.1',
    region: 'ANK',
    firewallRules: [
      { id: faker.string.uuid(), name: 'allow-ssh', direction: 'ingress', protocol: 'tcp', portRange: '22', source: 'any', action: 'allow' },
      { id: faker.string.uuid(), name: 'allow-http', direction: 'ingress', protocol: 'tcp', portRange: '3000-4000', source: 'any', action: 'allow' },
      { id: faker.string.uuid(), name: 'deny-all-inbound', direction: 'ingress', protocol: 'all', portRange: 'all', source: 'any', action: 'deny' },
    ],
    routes: [
      { id: faker.string.uuid(), destination: '0.0.0.0/0', nextHop: 'nat-gateway', priority: 100, status: 'pending' },
    ],
    peerings: [
      { id: faker.string.uuid(), peerVpc: 'prod-vpc-01', peerRegion: 'ANK', peerCidr: '10.0.0.0/16', status: 'pending' },
      { id: faker.string.uuid(), peerVpc: 'staging-vpc', peerRegion: 'IST', peerCidr: '10.128.0.0/20', status: 'failed' },
    ],
    createdAt: new Date('2024-03-22').toISOString(),
  },
]

const RANDOM_ENTRIES: Network[] = Array.from({ length: 4 }, () => generateNetwork())

let networkStore: Network[] = [...SEED_DATA, ...RANDOM_ENTRIES]

// ---------------------------------------------------------------------------
// CRUD functions
// ---------------------------------------------------------------------------

export function getNetworks(): Network[] {
  return networkStore
}

export function getNetworkById(id: string): Network | undefined {
  return networkStore.find((network) => network.id === id)
}

export function createNetwork(input: CreateNetworkInput): Network {
  const octets = input.cidrBlock.split('.')
  const gateway = octets.length >= 2 ? `${octets[0]}.${octets[1]}.0.1` : '10.0.0.1'

  const network: Network = {
    id: faker.string.uuid(),
    vpcName: input.vpcName,
    cidrBlock: input.cidrBlock,
    type: input.type,
    status: 'active',
    gateway,
    region: faker.helpers.arrayElement(REGIONS),
    firewallRules: [],
    routes: [],
    peerings: [],
    createdAt: new Date().toISOString(),
  }
  networkStore = [...networkStore, network]
  return network
}

export function deleteNetwork(id: string): boolean {
  const before = networkStore.length
  networkStore = networkStore.filter((network) => network.id !== id)
  return networkStore.length < before
}

export function addFirewallRule(networkId: string, rule: CreateFirewallRuleInput): FirewallRule | undefined {
  const network = networkStore.find((n) => n.id === networkId)
  if (!network) return undefined

  const created: FirewallRule = { id: faker.string.uuid(), ...rule }
  networkStore = networkStore.map((n) => (n.id === networkId ? { ...n, firewallRules: [...n.firewallRules, created] } : n))
  return created
}

export function deleteFirewallRule(networkId: string, ruleId: string): boolean {
  const network = networkStore.find((n) => n.id === networkId)
  if (!network) return false

  const before = network.firewallRules.length
  const updatedRules = network.firewallRules.filter((rule) => rule.id !== ruleId)
  if (updatedRules.length === before) return false

  networkStore = networkStore.map((n) => (n.id === networkId ? { ...n, firewallRules: updatedRules } : n))
  return true
}
