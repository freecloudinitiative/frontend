/**
 * PR #34 — critical-flow integration test for the Network service.
 * Exercises the real hooks against the real MSW handlers end-to-end
 * (list -> add firewall rule -> rule appears on the network), rather than
 * testing each hook in isolation (see hooks.test.tsx for that).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { server } from '@/test/server'
import { getNetworks } from '@/mocks/data/networks'
import { useNetworks, useNetwork, useAddFirewallRule, useFirewallRules } from '@/features/network/hooks'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('Network — critical list+firewall-rule flow through MSW', () => {
  it('lists networks, adds a firewall rule, then sees it on the network (with cache invalidation)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const listBefore = renderHook(() => useNetworks(), { wrapper })
    await waitFor(() => expect(listBefore.result.current.isSuccess).toBe(true))
    expect(listBefore.result.current.data!.length).toBeGreaterThanOrEqual(7)

    const networkId = listBefore.result.current.data![0].id

    const detail = renderHook(() => useNetwork(networkId), { wrapper })
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true))
    const ruleCountBefore = detail.result.current.data!.firewallRules.length

    const addRule = renderHook(() => useAddFirewallRule(networkId), { wrapper })
    addRule.result.current.mutate({
      name: 'flow-test-rule',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '443',
      source: '0.0.0.0/0',
      action: 'allow',
    })
    await waitFor(() => expect(addRule.result.current.isSuccess).toBe(true))

    await waitFor(() => expect(detail.result.current.data!.firewallRules.length).toBe(ruleCountBefore + 1))
    expect(detail.result.current.data!.firewallRules.some((rule) => rule.name === 'flow-test-rule')).toBe(true)
  })
})

describe('useFirewallRules() — dedicated rules-list endpoint through MSW', () => {
  it('fetches the firewall rules for an existing network', async () => {
    const network = getNetworks()[0]
    const { result } = renderHook(() => useFirewallRules(network.id), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.length).toBe(network.firewallRules.length)
    const rule = result.current.data![0]
    expect(typeof rule.name).toBe('string')
    expect(['ingress', 'egress']).toContain(rule.direction)
  })

  it('is disabled when networkId is undefined', () => {
    const { result } = renderHook(() => useFirewallRules(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('errors for a nonexistent network id', async () => {
    const { result } = renderHook(() => useFirewallRules('no-such-network'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
