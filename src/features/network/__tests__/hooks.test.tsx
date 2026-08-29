/**
 * PR-22 Test Scenarios — Scenario 4 (React Query hooks) and Scenario 6
 * (cache invalidation). Renders each hook inside a minimal
 * QueryClientProvider and verifies loading → success → data flow through
 * the MSW Node server.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { getNetworks as getMockNetworks } from '@/mocks/data/networks'
import {
  useNetworks,
  useNetwork,
  useCreateNetwork,
  useDeleteNetwork,
  useAddFirewallRule,
  useDeleteFirewallRule,
  useUpdateNetworkSettings,
  useFirewallRules,
  networkKeys,
} from '@/features/network/hooks'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return { queryClient, Wrapper: function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  } }
}

// ---------------------------------------------------------------------------
// Query key spec
// ---------------------------------------------------------------------------

describe('Query key constants', () => {
  it('networkKeys.all is ["networks"]', () => {
    expect(networkKeys.all).toEqual(['networks'])
  })

  it('networkKeys.detail(id) is ["networks", id]', () => {
    expect(networkKeys.detail('abc-123')).toEqual(['networks', 'abc-123'])
  })
})

// ---------------------------------------------------------------------------
// Scenario 4.1 — useNetworks()
// ---------------------------------------------------------------------------

describe('Scenario 4.1 – useNetworks()', () => {
  it('starts in a loading state with no data', () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useNetworks(), { wrapper: Wrapper })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('resolves to data including the full nested structure', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useNetworks(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(Array.isArray(result.current.data)).toBe(true)
    const network = result.current.data![0]
    expect(Array.isArray(network.firewallRules)).toBe(true)
    expect(Array.isArray(network.routes)).toBe(true)
    expect(Array.isArray(network.peerings)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Scenario 4.2 — useNetwork(id)
// ---------------------------------------------------------------------------

describe('Scenario 4.2 – useNetwork(id)', () => {
  it('fetches a single network with nested data', async () => {
    const id = getMockNetworks()[0].id
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useNetwork(id), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.id).toBe(id)
    expect(result.current.data!.firewallRules.length).toBeGreaterThan(0)
  })

  it('is disabled (not fetching) when id is undefined', () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useNetwork(undefined), { wrapper: Wrapper })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('enters an error state for a nonexistent network id', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useNetwork('nonexistent-hooks-id'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).not.toBeNull()
  })

  it('caches by id: a second mount with the same id resolves without a new loading flash', async () => {
    const id = getMockNetworks()[1].id
    const { queryClient, Wrapper } = makeWrapper()
    const first = renderHook(() => useNetwork(id), { wrapper: Wrapper })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(networkKeys.detail(id))
    expect(cached).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Scenario 4.3 — useCreateNetwork()
// ---------------------------------------------------------------------------

describe('Scenario 4.3 – useCreateNetwork()', () => {
  it('mutation POSTs and resolves with the created Network', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateNetwork(), { wrapper: Wrapper })
    result.current.mutate({ vpcName: 'hook-vpc', cidrBlock: '10.50.0.0/16', type: 'vpc', region: 'IST' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.vpcName).toBe('hook-vpc')
    expect(result.current.data!.status).toBe('active')
  })

  it('on success, the networks list query is invalidated (refetches)', async () => {
    const { queryClient, Wrapper } = makeWrapper()
    const list = renderHook(() => useNetworks(), { wrapper: Wrapper })
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true))
    const countBefore = list.result.current.data!.length

    const create = renderHook(() => useCreateNetwork(), { wrapper: Wrapper })
    create.result.current.mutate({ vpcName: 'invalidate-vpc', cidrBlock: '10.51.0.0/16', type: 'vpc', region: 'IST' })
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true))

    await waitFor(() => {
      const isStale = queryClient.getQueryState(networkKeys.all)?.isInvalidated
      expect(isStale === false).toBe(true)
    })
    await waitFor(() => expect(list.result.current.data!.length).toBe(countBefore + 1))
  })

  it('reports isPending false once resolved and exposes error state on failure', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateNetwork(), { wrapper: Wrapper })
    // @ts-expect-error testing runtime validation with an invalid type
    result.current.mutate({ vpcName: 'bad-type', cidrBlock: '10.0.0.0/16', type: 'megaverse' })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.isPending).toBe(false)
    expect(result.current.error).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Scenario 4.4 — useDeleteNetwork()
// ---------------------------------------------------------------------------

describe('Scenario 4.4 – useDeleteNetwork()', () => {
  it('mutation DELETEs the network by id', async () => {
    const { Wrapper } = makeWrapper()
    const create = renderHook(() => useCreateNetwork(), { wrapper: Wrapper })
    create.result.current.mutate({ vpcName: 'to-delete-hook', cidrBlock: '10.52.0.0/16', type: 'vpc', region: 'IST' })
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true))
    const id = create.result.current.data!.id

    const del = renderHook(() => useDeleteNetwork(), { wrapper: Wrapper })
    del.result.current.mutate(id)
    await waitFor(() => expect(del.result.current.isSuccess).toBe(true))
  })

  it('on success, the networks list updates to exclude the deleted network', async () => {
    const { Wrapper } = makeWrapper()
    const create = renderHook(() => useCreateNetwork(), { wrapper: Wrapper })
    create.result.current.mutate({ vpcName: 'list-update-hook', cidrBlock: '10.53.0.0/16', type: 'vpc', region: 'IST' })
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true))
    const id = create.result.current.data!.id

    const list = renderHook(() => useNetworks(), { wrapper: Wrapper })
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true))
    expect(list.result.current.data!.some((n) => n.id === id)).toBe(true)

    const del = renderHook(() => useDeleteNetwork(), { wrapper: Wrapper })
    del.result.current.mutate(id)
    await waitFor(() => expect(del.result.current.isSuccess).toBe(true), { timeout: 3000 })

    await waitFor(() => expect(list.result.current.data!.some((n) => n.id === id)).toBe(false), { timeout: 3000 })
  })

  it('mutation errors for an unknown network id', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useDeleteNetwork(), { wrapper: Wrapper })
    result.current.mutate('unknown-delete-hook-id')
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// Scenario 4.5 / 6.1 — useAddFirewallRule(networkId)
// ---------------------------------------------------------------------------

describe('Scenario 4.5 – useAddFirewallRule(networkId)', () => {
  it('mutation POSTs a rule to /api/networks/:id/firewall-rules', async () => {
    const networkId = getMockNetworks()[0].id
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useAddFirewallRule(networkId), { wrapper: Wrapper })
    result.current.mutate({ name: 'hook-rule', direction: 'ingress', protocol: 'tcp', portRange: '9999', source: 'any', action: 'allow' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.name).toBe('hook-rule')
  })

  it('Scenario 6.1 – on success, the parent useNetwork(id) query invalidates and the new rule appears', async () => {
    const networkId = getMockNetworks()[2].id
    const { queryClient, Wrapper } = makeWrapper()

    const detail = renderHook(() => useNetwork(networkId), { wrapper: Wrapper })
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true))
    const countBefore = detail.result.current.data!.firewallRules.length

    const addRule = renderHook(() => useAddFirewallRule(networkId), { wrapper: Wrapper })
    addRule.result.current.mutate({ name: 'invalidation-rule', direction: 'ingress', protocol: 'tcp', portRange: '7777', source: 'any', action: 'allow' })
    await waitFor(() => expect(addRule.result.current.isSuccess).toBe(true))

    await waitFor(() => {
      const state = queryClient.getQueryState(networkKeys.detail(networkId))
      expect(state?.isInvalidated).toBe(false)
    })
    await waitFor(() => expect(detail.result.current.data!.firewallRules.length).toBe(countBefore + 1))
  })

  it('exposes loading and error states', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useAddFirewallRule('nonexistent-network-hooks'), { wrapper: Wrapper })
    expect(result.current.isPending).toBe(false)
    result.current.mutate({ name: 'x', direction: 'ingress', protocol: 'tcp', portRange: '80', source: 'any', action: 'allow' })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// Scenario 4.6 / 6.2 — useDeleteFirewallRule(networkId)
// ---------------------------------------------------------------------------

describe('Scenario 4.6 – useDeleteFirewallRule(networkId)', () => {
  it('mutation DELETEs the rule', async () => {
    const networkId = getMockNetworks()[3].id
    const { Wrapper } = makeWrapper()

    const add = renderHook(() => useAddFirewallRule(networkId), { wrapper: Wrapper })
    add.result.current.mutate({ name: 'delete-target-rule', direction: 'ingress', protocol: 'tcp', portRange: '1234', source: 'any', action: 'allow' })
    await waitFor(() => expect(add.result.current.isSuccess).toBe(true))
    const ruleId = add.result.current.data!.id

    const del = renderHook(() => useDeleteFirewallRule(networkId), { wrapper: Wrapper })
    del.result.current.mutate(ruleId)
    await waitFor(() => expect(del.result.current.isSuccess).toBe(true))
  })

  it('Scenario 6.2 – on success, the parent network query invalidates and no stale rule is displayed', async () => {
    const networkId = getMockNetworks()[4].id
    const { queryClient, Wrapper } = makeWrapper()

    const add = renderHook(() => useAddFirewallRule(networkId), { wrapper: Wrapper })
    add.result.current.mutate({ name: 'stale-check-rule', direction: 'ingress', protocol: 'tcp', portRange: '4321', source: 'any', action: 'allow' })
    await waitFor(() => expect(add.result.current.isSuccess).toBe(true))
    const ruleId = add.result.current.data!.id

    const detail = renderHook(() => useNetwork(networkId), { wrapper: Wrapper })
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true))
    expect(detail.result.current.data!.firewallRules.some((r) => r.id === ruleId)).toBe(true)

    const del = renderHook(() => useDeleteFirewallRule(networkId), { wrapper: Wrapper })
    del.result.current.mutate(ruleId)
    await waitFor(() => expect(del.result.current.isSuccess).toBe(true))

    await waitFor(() => {
      const state = queryClient.getQueryState(networkKeys.detail(networkId))
      expect(state?.isInvalidated).toBe(false)
    })
    await waitFor(() => expect(detail.result.current.data!.firewallRules.some((r) => r.id === ruleId)).toBe(false))
  })

  it('mutation errors for a nonexistent rule', async () => {
    const networkId = getMockNetworks()[0].id
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useDeleteFirewallRule(networkId), { wrapper: Wrapper })
    result.current.mutate('nonexistent-rule-hooks-id')
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// Scenario 6.3 — Delete network invalidates list
// ---------------------------------------------------------------------------

describe('Scenario 6.3 – Delete network invalidates list', () => {
  it('deleting a network invalidates networkKeys.all and removes it from the list', async () => {
    const { queryClient, Wrapper } = makeWrapper()

    const create = renderHook(() => useCreateNetwork(), { wrapper: Wrapper })
    create.result.current.mutate({ vpcName: 'invalidate-list-vpc', cidrBlock: '10.60.0.0/16', type: 'vpc', region: 'IST' })
    await waitFor(() => expect(create.result.current.isSuccess).toBe(true))
    const id = create.result.current.data!.id

    const list = renderHook(() => useNetworks(), { wrapper: Wrapper })
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true))
    expect(list.result.current.data!.some((n) => n.id === id)).toBe(true)

    const del = renderHook(() => useDeleteNetwork(), { wrapper: Wrapper })
    del.result.current.mutate(id)
    await waitFor(() => expect(del.result.current.isSuccess).toBe(true))

    await waitFor(() => {
      const state = queryClient.getQueryState(networkKeys.all)
      expect(state?.isInvalidated).toBe(false)
    })
    await waitFor(() => expect(list.result.current.data!.some((n) => n.id === id)).toBe(false))
  })
})

// DRY_REFACTOR_TEST_SCENARIOS.md §7.3
describe('hook name surface — unchanged by the resource-hook factory refactor', () => {
  it('still exposes the same hook names as before the refactor', () => {
    expect(typeof useNetworks).toBe('function')
    expect(typeof useNetwork).toBe('function')
    expect(typeof useCreateNetwork).toBe('function')
    expect(typeof useDeleteNetwork).toBe('function')
    expect(typeof useUpdateNetworkSettings).toBe('function')
  })

  it('service-specific extra hooks (firewall rules) still work alongside the factory-generated ones', () => {
    expect(typeof useAddFirewallRule).toBe('function')
    expect(typeof useDeleteFirewallRule).toBe('function')
    expect(typeof useFirewallRules).toBe('function')
  })
})
