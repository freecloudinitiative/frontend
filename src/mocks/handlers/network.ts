import { http, HttpResponse, delay } from 'msw'
import { createGetByIdHandler, createDeleteHandler, createSettingsPatchHandler, createListHandler, defaultJitter as jitter, errorBody } from './utils'
import {
  getNetworks,
  getNetworkById,
  createNetwork,
  deleteNetwork,
  addFirewallRule,
  deleteFirewallRule,
} from '@/mocks/data/networks'
import type { CreateFirewallRuleInput, CreateNetworkInput } from '@/features/network/types'

const VALID_TYPES = new Set(['vpc', 'subnet', 'public'])
const VALID_DIRECTIONS = new Set(['ingress', 'egress'])
const VALID_PROTOCOLS = new Set(['tcp', 'udp', 'icmp', 'all'])
const VALID_ACTIONS = new Set(['allow', 'deny'])

export const networkHandlers = [
  // GET /api/networks — returns network list (with nested data)
  createListHandler('*/api/networks', getNetworks),

  // GET /api/networks/:id/firewall-rules — firewall rules for a network
  http.get('*/api/networks/:id/firewall-rules', async ({ params }) => {
    await delay(jitter())

    const network = getNetworkById(params.id as string)
    if (!network) {
      return HttpResponse.json(errorBody('resource_not_found', 'Network not found'), { status: 404 })
    }
    return HttpResponse.json(network.firewallRules)
  }),

  // GET /api/networks/:id — single network with nested firewall rules, routes, peerings
  createGetByIdHandler('*/api/networks/:id', getNetworkById, 'Network', jitter),

  // POST /api/networks — create network
  http.post('*/api/networks', async ({ request }) => {
    await delay(jitter())

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json(errorBody('invalid_input', 'Invalid JSON body'), { status: 400 })
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return HttpResponse.json(errorBody('invalid_input', 'Body must be a JSON object'), { status: 400 })
    }

    const b = body as Record<string, unknown>

    if (typeof b.vpcName !== 'string' || b.vpcName.trim().length === 0) {
      return HttpResponse.json(errorBody('invalid_input', 'vpcName is required and must be a non-empty string'), { status: 400 })
    }
    if (typeof b.cidrBlock !== 'string' || b.cidrBlock.trim().length === 0) {
      return HttpResponse.json(errorBody('invalid_input', 'cidrBlock is required and must be a non-empty string'), { status: 400 })
    }
    if (typeof b.type !== 'string' || !VALID_TYPES.has(b.type)) {
      return HttpResponse.json(errorBody('invalid_input', `type must be one of: ${[...VALID_TYPES].join(', ')}`), { status: 400 })
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

  // DELETE /api/networks/:id
  createDeleteHandler('*/api/networks/:id', deleteNetwork, 'Network', jitter),

  // POST /api/networks/:id/firewall-rules — add a firewall rule
  http.post('*/api/networks/:id/firewall-rules', async ({ params, request }) => {
    await delay(jitter())

    const network = getNetworkById(params.id as string)
    if (!network) {
      return HttpResponse.json(errorBody('resource_not_found', 'Network not found'), { status: 404 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json(errorBody('invalid_input', 'Invalid JSON body'), { status: 400 })
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return HttpResponse.json(errorBody('invalid_input', 'Body must be a JSON object'), { status: 400 })
    }

    const b = body as Record<string, unknown>

    if (typeof b.name !== 'string' || b.name.trim().length === 0) {
      return HttpResponse.json(errorBody('invalid_input', 'name is required and must be a non-empty string'), { status: 400 })
    }
    if (typeof b.direction !== 'string' || !VALID_DIRECTIONS.has(b.direction)) {
      return HttpResponse.json(errorBody('invalid_input', `direction must be one of: ${[...VALID_DIRECTIONS].join(', ')}`), { status: 400 })
    }
    if (typeof b.protocol !== 'string' || !VALID_PROTOCOLS.has(b.protocol)) {
      return HttpResponse.json(errorBody('invalid_input', `protocol must be one of: ${[...VALID_PROTOCOLS].join(', ')}`), { status: 400 })
    }
    if (typeof b.portRange !== 'string' || b.portRange.trim().length === 0) {
      return HttpResponse.json(errorBody('invalid_input', 'portRange is required and must be a non-empty string'), { status: 400 })
    }
    if (typeof b.source !== 'string' || b.source.trim().length === 0) {
      return HttpResponse.json(errorBody('invalid_input', 'source is required and must be a non-empty string'), { status: 400 })
    }
    if (typeof b.action !== 'string' || !VALID_ACTIONS.has(b.action)) {
      return HttpResponse.json(errorBody('invalid_input', `action must be one of: ${[...VALID_ACTIONS].join(', ')}`), { status: 400 })
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
      return HttpResponse.json(errorBody('resource_not_found', 'Network not found'), { status: 404 })
    }

    const deleted = deleteFirewallRule(params.id as string, params.ruleId as string)
    if (!deleted) {
      return HttpResponse.json(errorBody('resource_not_found', 'Firewall rule not found'), { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // PATCH /api/networks/:id/settings
  createSettingsPatchHandler('*/api/networks/:id/settings', getNetworkById, 'Network', jitter),
]
