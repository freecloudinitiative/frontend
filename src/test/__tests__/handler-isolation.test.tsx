/**
 * PR #34, doc scenario 13 ("Test Isolation & Store Reset") — adapted to how
 * this repo's test infra actually works.
 *
 * Our MSW handlers back onto shared, mutable, module-level in-memory stores
 * (see src/mocks/data/*.ts) rather than a per-test-reset store, so mutations
 * from one test (e.g. creating a VM) persist for the rest of the run. Every
 * existing hooks/flow test already works around this by asserting with
 * `toBeGreaterThanOrEqual(n)` instead of an exact count — see e.g.
 * src/features/vm/__tests__/vm.test.tsx.
 *
 * What genuinely IS isolated per test is the MSW *handler* list: each test
 * file's `afterEach(() => server.resetHandlers())` discards any `server.use()`
 * override once the test ends, so the next test always sees the real handler
 * again. That's what this file verifies directly.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { useVms } from '@/features/vm/hooks'

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

describe('MSW handler overrides are isolated per test', () => {
  it('test A: an overridden handler returns an empty list', async () => {
    server.use(http.get('*/api/vms', () => HttpResponse.json([])))

    const { result } = renderHook(() => useVms(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('test B: the real handler and real mock data are back, unaffected by test A', async () => {
    const { result } = renderHook(() => useVms(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.length).toBeGreaterThanOrEqual(9)
  })
})
