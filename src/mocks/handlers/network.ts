import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import {
  getNetworks,
  getNetworkById,
  createNetwork,
  deleteNetwork,
  addFirewallRule,
  deleteFirewallRule,
} from '@/mocks/data/networks'
import type { CreateFirewallRuleInput, CreateNetworkInput } from '@/features/network/types'

// Artificial delay range (ms) — makes loading states visible during development
const DELAY_MIN = 300
const DELAY_MAX = 600

function jitter() {
  return faker.number.int({ min: DELAY_MIN, max: DELAY_MAX })
}

const VALID_TYPES = new Set(['vpc', 'subnet', 'public'])
const VALID_DIRECTIONS = new Set(['ingress', 'egress'])
const VALID_PROTOCOLS = new Set(['tcp', 'udp', 'icmp', 'all'])
const VALID_ACTIONS = new Set(['allow', 'deny'])

export const networkHandlers = [
  // GET /api/networks — returns network list (with nested data)
  http.get('*/api/networks', async () => {
    await delay(jitter())
    return HttpResponse.json(getNetworks())
  }),

  // GET /api/networks/:id/firewall-rules — firewall rules for a network
  http.get('*/api/networks/:id/firewall-rules', async ({ params }) => {
    await delay(jitter())

    const network = getNetworkById(params.id as string)
    if (!network) {
      return HttpResponse.json({ error: 'Network not found' }, { status: 404 })
    }
    return HttpResponse.json(network.firewallRules)
  }),

  // GET /api/networks/:id — single network with nested firewall rules, routes, peerings
  http.get('*/api/networks/:id', async ({ params }) => {
    await delay(jitter())

    const network = getNetworkById(params.id as string)
    if (!network) {
      return HttpResponse.json({ error: 'Network not found' }, { status: 404 })
    }
    return HttpResponse.json(network)
  }),

  // POST /api/networks — create network
  http.post('*/api/networks', async ({ request }) => {
    await delay(jitter())

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return HttpResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
    }

    const b = body as Record<string, unknown>

    if (typeof b.vpcName !== 'string' || b.vpcName.trim().length === 0) {
      return HttpResponse.json({ error: 'vpcName is required and must be a non-empty string' }, { status: 400 })
    }
    if (typeof b.cidrBlock !== 'string' || b.cidrBlock.trim().length === 0) {
      return HttpResponse.json({ error: 'cidrBlock is required and must be a non-empty string' }, { status: 400 })
    }
    if (typeof b.type !== 'string' || !VALID_TYPES.has(b.type)) {
      return HttpResponse.json({ error: `type must be one of: ${[...VALID_TYPES].join(', ')}` }, { status: 400 })
    }

    const input: CreateNetworkInput = {
      vpcName: b.vpcName.trim(),
      cidrBlock: b.cidrBlock.trim(),
      type: b.type as CreateNetworkInput['type'],
      ...(typeof b.region === 'string' && (b.region === 'ANK' || b.region === 'IST') ? { region: b.region } : {}),
    }

    const network = createNetwork(input)
    return HttpResponse.json(network, { status: 201 })
  }),

  // DELETE /api/networks/:id — delete network
  http.delete('*/api/networks/:id', async ({ params }) => {
    await delay(jitter())

    const deleted = deleteNetwork(params.id as string)
    if (!deleted) {
      return HttpResponse.json({ error: 'Network not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // POST /api/networks/:id/firewall-rules — add a firewall rule
  http.post('*/api/networks/:id/firewall-rules', async ({ params, request }) => {
    await delay(jitter())

    const network = getNetworkById(params.id as string)
    if (!network) {
      return HttpResponse.json({ error: 'Network not found' }, { status: 404 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return HttpResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
    }

    const b = body as Record<string, unknown>

    if (typeof b.name !== 'string' || b.name.trim().length === 0) {
      return HttpResponse.json({ error: 'name is required and must be a non-empty string' }, { status: 400 })
    }
    if (typeof b.direction !== 'string' || !VALID_DIRECTIONS.has(b.direction)) {
      return HttpResponse.json({ error: `direction must be one of: ${[...VALID_DIRECTIONS].join(', ')}` }, { status: 400 })
    }
    if (typeof b.protocol !== 'string' || !VALID_PROTOCOLS.has(b.protocol)) {
      return HttpResponse.json({ error: `protocol must be one of: ${[...VALID_PROTOCOLS].join(', ')}` }, { status: 400 })
    }
    if (typeof b.portRange !== 'string' || b.portRange.trim().length === 0) {
      return HttpResponse.json({ error: 'portRange is required and must be a non-empty string' }, { status: 400 })
    }
    if (typeof b.source !== 'string' || b.source.trim().length === 0) {
      return HttpResponse.json({ error: 'source is required and must be a non-empty string' }, { status: 400 })
    }
    if (typeof b.action !== 'string' || !VALID_ACTIONS.has(b.action)) {
      return HttpResponse.json({ error: `action must be one of: ${[...VALID_ACTIONS].join(', ')}` }, { status: 400 })
    }

    const input: CreateFirewallRuleInput = {
      name: b.name.trim(),
      direction: b.direction as CreateFirewallRuleInput['direction'],
      protocol: b.protocol as CreateFirewallRuleInput['protocol'],
      portRange: b.portRange.trim(),
      source: b.source.trim(),
      action: b.action as CreateFirewallRuleInput['action'],
    }

    const rule = addFirewallRule(params.id as string, input)
    return HttpResponse.json(rule, { status: 201 })
  }),

  // DELETE /api/networks/:id/firewall-rules/:ruleId — delete a firewall rule
  http.delete('*/api/networks/:id/firewall-rules/:ruleId', async ({ params }) => {
    await delay(jitter())

    const network = getNetworkById(params.id as string)
    if (!network) {
      return HttpResponse.json({ error: 'Network not found' }, { status: 404 })
    }

    const deleted = deleteFirewallRule(params.id as string, params.ruleId as string)
    if (!deleted) {
      return HttpResponse.json({ error: 'Firewall rule not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
