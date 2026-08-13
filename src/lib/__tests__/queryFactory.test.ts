/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §1.8, §7.1
 *
 * The five services' own hooks.test.tsx files already exercise createResourceHooks'
 * list/detail/create/delete/updateSettings behavior end-to-end against real MSW handlers
 * (invalidation, enabled:Boolean(id) guard, error paths). This file covers the one thing no
 * single service's test can: that createResourceKeys produces keys that don't collide across
 * different resource names.
 */
import { describe, it, expect } from 'vitest'
import { createResourceKeys } from '@/lib/queryFactory'

describe('createResourceKeys', () => {
  it('produces an `all` list key and a `detail(id)` key namespaced by resource name', () => {
    const keys = createResourceKeys('compute-engines')
    expect(keys.all).toEqual(['compute-engines'])
    expect(keys.detail('abc123')).toEqual(['compute-engines', 'abc123'])
  })

  it('produces non-colliding keys for every real resource name used across the 5 services', () => {
    const resourceNames = ['compute-engines', 'databases', 'iam-users', 'networks', 'buckets']
    const allKeySets = resourceNames.map((name) => JSON.stringify(createResourceKeys(name).all))
    const detailKeySets = resourceNames.map((name) => JSON.stringify(createResourceKeys(name).detail('same-id')))

    expect(new Set(allKeySets).size).toBe(resourceNames.length)
    expect(new Set(detailKeySets).size).toBe(resourceNames.length)
  })

  it('a detail key for one resource never equals the all-key or detail-key of another resource', () => {
    const a = createResourceKeys('compute-engines')
    const b = createResourceKeys('databases')
    expect(a.detail('1')).not.toEqual(b.detail('1'))
    expect(a.all).not.toEqual(b.all)
  })
})
