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
import { useNetworks, useNetwork, useAddFirewallRule } from '@/features/network/hooks'

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
  it('lists networks, adds a firewall rule, then sees it on the network', async () => {
    const listBefore = renderHook(() => useNetworks(), { wrapper: makeWrapper() })
    await waitFor(() => expect(listBefore.result.current.isSuccess).toBe(true))
    expect(listBefore.result.current.data!.length).toBeGreaterThanOrEqual(7)

    const networkId = getNetworks()[0].id

    const addRule = renderHook(() => useAddFirewallRule(networkId), { wrapper: makeWrapper() })
    addRule.result.current.mutate({
      name: 'flow-test-rule',
      direction: 'ingress',
      protocol: 'tcp',
      portRange: '443',
      source: '0.0.0.0/0',
      action: 'allow',
    })
    await waitFor(() => expect(addRule.result.current.isSuccess).toBe(true))

    const detail = renderHook(() => useNetwork(networkId), { wrapper: makeWrapper() })
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true))
    expect(detail.result.current.data!.firewallRules.some((rule) => rule.name === 'flow-test-rule')).toBe(true)
  })
})
