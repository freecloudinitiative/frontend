/**
 * PR-22 Test Scenarios — Scenario 2 (Network API endpoints), Scenario 3
 * (firewall rule endpoints), Scenario 7 (error handling), Scenario 8.1/8.2
 * (nested data integrity via HTTP), Scenario 10 (handler registration).
 * Uses a real Node-based MSW server + fetch (Node 18+).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'
import { getNetworks } from '@/mocks/data/networks'
import { networkHandlers } from '@/mocks/handlers/network'

const BASE = 'http://localhost'

async function get(path: string) {
  return fetch(`${BASE}${path}`)
}
async function post(path: string, body: unknown) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
async function del(path: string) {
  return fetch(`${BASE}${path}`, { method: 'DELETE' })
}

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Scenario 2.1 — GET /api/networks (list)
// ---------------------------------------------------------------------------

describe('Scenario 2.1 – GET /api/networks (list)', () => {
  it('returns HTTP 200 with all 6-8 networks', async () => {
    const res = await get('/api/networks')
    expect(res.status).toBe(200)
    const data = await res.json() as unknown[]
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThanOrEqual(6)
  })

  it('each network in the list includes populated nested arrays', async () => {
    const res = await get('/api/networks')
    const data = await res.json() as Record<string, unknown>[]
    data.forEach((n) => {
      expect(Array.isArray(n.firewallRules)).toBe(true)
      expect(Array.isArray(n.routes)).toBe(true)
      expect(Array.isArray(n.peerings)).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// Scenario 2.2 — GET /api/networks/:id (single)
// ---------------------------------------------------------------------------

describe('Scenario 2.2 – GET /api/networks/:id (single)', () => {
  it('returns HTTP 200 with the correct network and all nested data', async () => {
    const id = getNetworks()[0].id
    const res = await get(`/api/networks/${id}`)
    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect(data.id).toBe(id)
    expect(Array.isArray(data.firewallRules)).toBe(true)
    expect((data.firewallRules as unknown[]).length).toBeGreaterThan(0)
    expect(Array.isArray(data.routes)).toBe(true)
    expect((data.routes as unknown[]).length).toBeGreaterThan(0)
    expect(Array.isArray(data.peerings)).toBe(true)
    expect((data.peerings as unknown[]).length).toBeGreaterThan(0)
  })

  it('returns HTTP 404 for unknown ID (Scenario 7.1)', async () => {
    const res = await get('/api/networks/nonexistent-network-id')
    expect(res.status).toBe(404)
    const data = await res.json() as { error: { code: string; message: string } }
    expect(typeof data.error.message).toBe('string')
    expect(data.error.code).toBe('resource_not_found')
  })
})

// ---------------------------------------------------------------------------
// Scenario 2.3 — POST /api/networks (create)
// ---------------------------------------------------------------------------

describe('Scenario 2.3 – POST /api/networks (create)', () => {
  it('creates a network and returns HTTP 201 with generated id/createdAt and empty nested arrays', async () => {
    const res = await post('/api/networks', { vpcName: 'test-vpc', cidrBlock: '10.0.0.0/16', type: 'vpc', region: 'IST' })
    expect(res.status).toBe(201)
    const data = await res.json() as Record<string, unknown>
    expect(typeof data.id).toBe('string')
    expect(data.vpcName).toBe('test-vpc')
    expect(data.cidrBlock).toBe('10.0.0.0/16')
    expect(data.type).toBe('vpc')
    expect(typeof data.createdAt).toBe('string')
    expect(data.firewallRules).toEqual([])
    expect(data.routes).toEqual([])
    expect(data.peerings).toEqual([])
  })

  it('a subsequent GET list includes the new network', async () => {
    const created = await (await post('/api/networks', { vpcName: 'listed-vpc', cidrBlock: '10.5.0.0/16', type: 'vpc', region: 'IST' })).json() as { id: string }
    const list = await (await get('/api/networks')).json() as { id: string }[]
    expect(list.some((n) => n.id === created.id)).toBe(true)
  })

  it('rejects missing vpcName with HTTP 400', async () => {
    const res = await post('/api/networks', { cidrBlock: '10.0.0.0/16', type: 'vpc', region: 'IST' })
    expect(res.status).toBe(400)
  })

  it('rejects missing cidrBlock with HTTP 400', async () => {
    const res = await post('/api/networks', { vpcName: 'no-cidr', type: 'vpc', region: 'IST' })
    expect(res.status).toBe(400)
  })

  it('rejects invalid type with HTTP 400 (Scenario 7.2 style)', async () => {
    const res = await post('/api/networks', { vpcName: 'bad-type', cidrBlock: '10.0.0.0/16', type: 'supernet' })
    expect(res.status).toBe(400)
    const data = await res.json() as { error: { code: string; message: string } }
    expect(typeof data.error.message).toBe('string')
    expect(data.error.code).toBe('invalid_input')
  })
})

// ---------------------------------------------------------------------------
// Scenario 2.4 — DELETE /api/networks/:id
// ---------------------------------------------------------------------------

describe('Scenario 2.4 – DELETE /api/networks/:id', () => {
  it('deletes a network and returns HTTP 204', async () => {
    const created = await (await post('/api/networks', { vpcName: 'delete-me', cidrBlock: '10.6.0.0/16', type: 'vpc', region: 'IST' })).json() as { id: string }
    const res = await del(`/api/networks/${created.id}`)
    expect(res.status).toBe(204)
  })

  it('subsequent GET list excludes the deleted network', async () => {
    const created = await (await post('/api/networks', { vpcName: 'gone-vpc', cidrBlock: '10.7.0.0/16', type: 'vpc', region: 'IST' })).json() as { id: string }
    await del(`/api/networks/${created.id}`)
    const list = await (await get('/api/networks')).json() as { id: string }[]
    expect(list.some((n) => n.id === created.id)).toBe(false)
  })

  it('returns HTTP 404 for a nonexistent network', async () => {
    const res = await del('/api/networks/nonexistent-delete-id')
    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// Scenario 3.1 — POST /api/networks/:id/firewall-rules (add rule)
// ---------------------------------------------------------------------------

describe('Scenario 3.1 – POST /api/networks/:id/firewall-rules (add rule)', () => {
  it('adds a rule and returns HTTP 201 with a generated id', async () => {
    const id = getNetworks()[0].id
    const res = await post(`/api/networks/${id}/firewall-rules`, {
      name: 'allow-custom',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '9000',
      source: 'any',
      action: 'allow',
    })
    expect(res.status).toBe(201)
    const rule = await res.json() as Record<string, unknown>
    expect(typeof rule.id).toBe('string')
    expect(rule.name).toBe('allow-custom')
  })

  it('rule is added to the network\'s firewallRules and visible on subsequent GET', async () => {
    const id = getNetworks()[1].id
    const before = await (await get(`/api/networks/${id}`)).json() as { firewallRules: unknown[] }
    const created = await (await post(`/api/networks/${id}/firewall-rules`, {
      name: 'persist-check',
      direction: 'egress',
      protocol: 'udp',
      portRange: '53',
      source: 'any',
      action: 'allow',
    })).json() as { id: string }

    const after = await (await get(`/api/networks/${id}`)).json() as { firewallRules: { id: string }[] }
    expect(after.firewallRules.length).toBe(before.firewallRules.length + 1)
    expect(after.firewallRules.some((r) => r.id === created.id)).toBe(true)
  })

  it('returns HTTP 404 when the network does not exist', async () => {
    const res = await post('/api/networks/nonexistent-network/firewall-rules', {
      name: 'x',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '80',
      source: 'any',
      action: 'allow',
    })
    expect(res.status).toBe(404)
  })

  it('rejects a malformed payload missing protocol with HTTP 400 (Scenario 7.2)', async () => {
    const id = getNetworks()[0].id
    const res = await post(`/api/networks/${id}/firewall-rules`, {
      name: 'missing-protocol',
      direction: 'ingress',
      portRange: '80',
      source: 'any',
      action: 'allow',
    })
    expect(res.status).toBe(400)
    const data = await res.json() as { error: { code: string; message: string } }
    expect(typeof data.error.message).toBe('string')
    expect(data.error.code).toBe('invalid_input')
  })

  it('rejects an invalid direction with HTTP 400', async () => {
    const id = getNetworks()[0].id
    const res = await post(`/api/networks/${id}/firewall-rules`, {
      name: 'bad-direction',
      direction: 'sideways',
      protocol: 'tcp',
      portRange: '80',
      source: 'any',
      action: 'allow',
    })
    expect(res.status).toBe(400)
  })

  it('rejects an invalid action with HTTP 400', async () => {
    const id = getNetworks()[0].id
    const res = await post(`/api/networks/${id}/firewall-rules`, {
      name: 'bad-action',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '80',
      source: 'any',
      action: 'reject',
    })
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// Scenario 3.2 — DELETE /api/networks/:id/firewall-rules/:ruleId
// ---------------------------------------------------------------------------

describe('Scenario 3.2 – DELETE /api/networks/:id/firewall-rules/:ruleId', () => {
  it('deletes a rule and returns HTTP 204', async () => {
    const id = getNetworks()[2].id
    const created = await (await post(`/api/networks/${id}/firewall-rules`, {
      name: 'to-delete',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '22',
      source: 'any',
      action: 'allow',
    })).json() as { id: string }

    const res = await del(`/api/networks/${id}/firewall-rules/${created.id}`)
    expect(res.status).toBe(204)
  })

  it('rule is removed from the network on subsequent GET', async () => {
    const id = getNetworks()[3].id
    const created = await (await post(`/api/networks/${id}/firewall-rules`, {
      name: 'gone-rule',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '22',
      source: 'any',
      action: 'allow',
    })).json() as { id: string }

    await del(`/api/networks/${id}/firewall-rules/${created.id}`)

    const after = await (await get(`/api/networks/${id}`)).json() as { firewallRules: { id: string }[] }
    expect(after.firewallRules.some((r) => r.id === created.id)).toBe(false)
  })

  it('returns HTTP 404 when the network does not exist', async () => {
    const res = await del('/api/networks/nonexistent-network/firewall-rules/some-rule')
    expect(res.status).toBe(404)
  })

  it('returns HTTP 404 when deleting a nonexistent rule (Scenario 7.3)', async () => {
    const id = getNetworks()[0].id
    const res = await del(`/api/networks/${id}/firewall-rules/nonexistent-rule-id`)
    expect(res.status).toBe(404)
  })

  it('deleting a nonexistent rule does not corrupt the network\'s existing rules', async () => {
    const id = getNetworks()[0].id
    const before = await (await get(`/api/networks/${id}`)).json() as { firewallRules: unknown[] }
    await del(`/api/networks/${id}/firewall-rules/nonexistent-rule-id`)
    const after = await (await get(`/api/networks/${id}`)).json() as { firewallRules: unknown[] }
    expect(after.firewallRules.length).toBe(before.firewallRules.length)
  })
})

// ---------------------------------------------------------------------------
// Scenario 3.3 — Nested validation
// ---------------------------------------------------------------------------

describe('Scenario 3.3 – Nested validation', () => {
  it('all rule IDs are unique within a network with multiple rules', async () => {
    const id = getNetworks()[0].id
    const network = await (await get(`/api/networks/${id}`)).json() as { firewallRules: { id: string }[] }
    const ids = network.firewallRules.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all rules have consistent structure with no null/undefined fields', async () => {
    const id = getNetworks()[0].id
    const network = await (await get(`/api/networks/${id}`)).json() as { firewallRules: Record<string, unknown>[] }
    network.firewallRules.forEach((rule) => {
      ;['id', 'name', 'direction', 'protocol', 'portRange', 'source', 'action'].forEach((key) => {
        expect(rule[key]).not.toBeNull()
        expect(rule[key]).not.toBeUndefined()
      })
    })
  })
})

// ---------------------------------------------------------------------------
// Scenario 7.2 — Malformed create-network payload
// ---------------------------------------------------------------------------

describe('Scenario 7.2 – Malformed POST /api/networks payload', () => {
  it('rejects invalid JSON body gracefully with HTTP 400', async () => {
    const res = await fetch(`${BASE}/api/networks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not valid json',
    })
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// Scenario 8 — Nested data integrity (HTTP level)
// ---------------------------------------------------------------------------

describe('Scenario 8 – Nested data integrity via HTTP', () => {
  it('8.1 – adding a rule preserves existing rules and only affects the target network', async () => {
    const id = getNetworks()[0].id
    const before = await (await get(`/api/networks/${id}`)).json() as { firewallRules: { id: string }[] }
    const beforeIds = before.firewallRules.map((r) => r.id)

    const created = await (await post(`/api/networks/${id}/firewall-rules`, {
      name: 'deep-nested-check',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '7000',
      source: 'any',
      action: 'allow',
    })).json() as { id: string }

    const after = await (await get(`/api/networks/${id}`)).json() as { firewallRules: { id: string }[] }
    beforeIds.forEach((existingId) => {
      expect(after.firewallRules.some((r) => r.id === existingId)).toBe(true)
    })
    expect(after.firewallRules.some((r) => r.id === created.id)).toBe(true)
  })

  it('8.2 – adding a rule to network A does not affect network B', async () => {
    const networkA = getNetworks()[0]
    const networkB = getNetworks()[1]
    const beforeB = await (await get(`/api/networks/${networkB.id}`)).json() as Record<string, unknown>

    await post(`/api/networks/${networkA.id}/firewall-rules`, {
      name: 'isolated',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '6000',
      source: 'any',
      action: 'allow',
    })

    const afterB = await (await get(`/api/networks/${networkB.id}`)).json() as Record<string, unknown>
    expect(afterB.firewallRules).toEqual(beforeB.firewallRules)
    expect(afterB.routes).toEqual(beforeB.routes)
    expect(afterB.peerings).toEqual(beforeB.peerings)
  })
})

// ---------------------------------------------------------------------------
// Scenario 10 — MSW handler registration
// ---------------------------------------------------------------------------

describe('Scenario 10.1 – MSW handler registration', () => {
  it('all 6 network endpoints are reachable end-to-end', async () => {
    const listRes = await get('/api/networks')
    expect(listRes.status).toBe(200)

    const id = getNetworks()[0].id
    const detailRes = await get(`/api/networks/${id}`)
    expect(detailRes.status).toBe(200)

    const createRes = await post('/api/networks', { vpcName: 'e2e-vpc', cidrBlock: '10.20.0.0/16', type: 'vpc', region: 'IST' })
    expect(createRes.status).toBe(201)
    const created = await createRes.json() as { id: string }

    const addRuleRes = await post(`/api/networks/${created.id}/firewall-rules`, {
      name: 'e2e-rule',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '443',
      source: 'any',
      action: 'allow',
    })
    expect(addRuleRes.status).toBe(201)
    const rule = await addRuleRes.json() as { id: string }

    const deleteRuleRes = await del(`/api/networks/${created.id}/firewall-rules/${rule.id}`)
    expect(deleteRuleRes.status).toBe(204)

    const deleteNetworkRes = await del(`/api/networks/${created.id}`)
    expect(deleteNetworkRes.status).toBe(204)
  })

  it('network endpoints do not bleed into other service namespaces', async () => {
    const res = await get('/api/networks')
    expect(res.status).toBe(200)
    // Sanity: a totally unrelated namespace should not be handled by network handlers
    const hasIamRoute = networkHandlers.some((h) => {
      const path = h.info.header
      return typeof path === 'string' && path.includes('/api/iam')
    })
    expect(hasIamRoute).toBe(false)
  })

  it('network handlers are registered, matching the spec', () => {
    expect(networkHandlers.length).toBeGreaterThanOrEqual(7)
  })
})
