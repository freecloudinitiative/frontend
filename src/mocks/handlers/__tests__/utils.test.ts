/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §1.5, §1.6, §3.2, §3.3, §7.6
 */
import { describe, it, expect, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { defaultJitter, createListHandler } from '@/mocks/handlers/utils'
import { computeEngineHandlers } from '@/mocks/handlers/computeEngine'
import { databaseHandlers } from '@/mocks/handlers/database'
import { iamHandlers } from '@/mocks/handlers/iam'
import { networkHandlers } from '@/mocks/handlers/network'
import { storageHandlers } from '@/mocks/handlers/storage'

describe('defaultJitter', () => {
  it('returns a number within the documented 300-600ms delay range', () => {
    for (let i = 0; i < 20; i++) {
      const value = defaultJitter()
      expect(value).toBeGreaterThanOrEqual(300)
      expect(value).toBeLessThanOrEqual(600)
    }
  })

  it('is actually invoked by each service handler (spot-checked via computeEngine list)', async () => {
    const server = setupServer(...computeEngineHandlers)
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const start = Date.now()
      const res = await fetch('http://localhost/api/compute-engines')
      const elapsed = Date.now() - start
      expect(res.status).toBe(200)
      // A perceptible mocked delay must still be present (>= ~250ms allowing scheduling jitter)
      expect(elapsed).toBeGreaterThanOrEqual(250)
    } finally {
      server.close()
    }
  })
})

interface FakeItem {
  id: string
  status: string
}

describe('createListHandler', () => {
  const items: FakeItem[] = [
    { id: '1', status: 'running' },
    { id: '2', status: 'stopped' },
    { id: '3', status: 'running' },
  ]

  it('returns the full list when no filter param is given', async () => {
    const handler = createListHandler('*/api/fake', () => items, { filterField: 'status' })
    const server = setupServer(handler)
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const res = await fetch('http://localhost/api/fake')
      const data = await res.json()
      expect(data).toHaveLength(3)
    } finally {
      server.close()
    }
  })

  it('filters by a configured filterableField when the query param is present', async () => {
    const handler = createListHandler('*/api/fake', () => items, { filterField: 'status' })
    const server = setupServer(handler)
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const res = await fetch('http://localhost/api/fake?status=running')
      const data = await res.json()
      expect(data).toEqual([{ id: '1', status: 'running' }, { id: '3', status: 'running' }])
    } finally {
      server.close()
    }
  })

  it('ignores unknown query params rather than erroring', async () => {
    const handler = createListHandler('*/api/fake', () => items, { filterField: 'status' })
    const server = setupServer(handler)
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const res = await fetch('http://localhost/api/fake?unrelated=1')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(3)
    } finally {
      server.close()
    }
  })

  it('services without filterableFields configured return the unfiltered list even with a status param', async () => {
    const handler = createListHandler('*/api/fake', () => items)
    const server = setupServer(handler)
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const res = await fetch('http://localhost/api/fake?status=running')
      const data = await res.json()
      expect(data).toHaveLength(3)
    } finally {
      server.close()
    }
  })

  it('threads a per-call jitter override instead of always using defaultJitter', async () => {
    const jitter = vi.fn(() => 5)
    const handler = createListHandler('*/api/fake', () => items, { jitter })
    const server = setupServer(handler)
    server.listen({ onUnhandledRequest: 'error' })
    try {
      await fetch('http://localhost/api/fake')
      expect(jitter).toHaveBeenCalledTimes(1)
    } finally {
      server.close()
    }
  })
})

describe('IAM/Network/Storage list endpoints — no status filter applied (§3.3)', () => {
  it.each([
    ['iam', iamHandlers, '/api/iam/users'],
    ['network', networkHandlers, '/api/networks'],
    ['storage', storageHandlers, '/api/buckets'],
  ] as const)('%s returns the full unfiltered list regardless of a status param', async (_name, handlers, path) => {
    const server = setupServer(...handlers)
    server.listen({ onUnhandledRequest: 'bypass' })
    try {
      const unfiltered = await (await fetch(`http://localhost${path}`)).json()
      const withBogusStatusParam = await (await fetch(`http://localhost${path}?status=running`)).json()
      expect(withBogusStatusParam).toEqual(unfiltered)
    } finally {
      server.close()
    }
  })
})

describe('Compute Engine/Database list endpoints — status filter applied (§3.2)', () => {
  it('Compute Engine list filters by status=stopped', async () => {
    const server = setupServer(...computeEngineHandlers)
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const all = await (await fetch('http://localhost/api/compute-engines')).json()
      const filtered = await (await fetch('http://localhost/api/compute-engines?status=stopped')).json()
      expect(filtered.length).toBeLessThanOrEqual(all.length)
      expect(filtered.every((ce: { status: string }) => ce.status === 'stopped')).toBe(true)
    } finally {
      server.close()
    }
  })

  it('Database list filters by status=stopped', async () => {
    const server = setupServer(...databaseHandlers)
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const all = await (await fetch('http://localhost/api/databases')).json()
      const filtered = await (await fetch('http://localhost/api/databases?status=stopped')).json()
      expect(filtered.length).toBeLessThanOrEqual(all.length)
      expect(filtered.every((db: { status: string }) => db.status === 'stopped')).toBe(true)
    } finally {
      server.close()
    }
  })
})
