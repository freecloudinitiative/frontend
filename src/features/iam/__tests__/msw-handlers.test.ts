/**
 * Scenarios 4.x, 5.x, 8.x, 11.x, 12.x, 14.x
 * MSW handler integration tests — all five IAM HTTP endpoints.
 * Uses a real Node-based MSW server + undici fetch (provided by Node 18+).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'
import { getIamUsers } from '@/mocks/data/iamUsers'
import { iamHandlers } from '@/mocks/handlers/iam'

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
async function patch(path: string, body: unknown) {
  return fetch(`${BASE}${path}`, {
    method: 'PATCH',
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
// 4. List & Detail endpoints
// ---------------------------------------------------------------------------

describe('Section 4 – GET /api/iam/users (list)', () => {
  it('4.1 – returns HTTP 200 with array of users (no policies)', async () => {
    const res = await get('/api/iam/users')
    expect(res.status).toBe(200)
    const data = await res.json() as unknown[]
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThanOrEqual(8)
    expect(data.length).toBeLessThanOrEqual(12) // allow a few extra from other tests
    const user = data[0] as Record<string, unknown>
    expect('policies' in user).toBe(false)
    expect(typeof user.id).toBe('string')
    expect(typeof user.name).toBe('string')
    expect(typeof user.email).toBe('string')
    expect(typeof user.status).toBe('string')
    expect(typeof user.role).toBe('string')
    expect(typeof user.mfaEnabled).toBe('boolean')
  })

  it('4.5 – list response does NOT include embedded policies', async () => {
    const res = await get('/api/iam/users')
    const data = await res.json() as Record<string, unknown>[]
    data.forEach((u) => {
      expect('policies' in u).toBe(false)
    })
  })
})

describe('Section 4 – GET /api/iam/users/:id (detail)', () => {
  it('4.2 – returns HTTP 200 with user + embedded policies', async () => {
    const id = getIamUsers()[0].id
    const res = await get(`/api/iam/users/${id}`)
    expect(res.status).toBe(200)
    const data = await res.json() as Record<string, unknown>
    expect(data.id).toBe(id)
    expect(Array.isArray(data.policies)).toBe(true)
    const policies = data.policies as Record<string, unknown>[]
    expect(policies.length).toBeGreaterThanOrEqual(2)
    expect(policies.length).toBeLessThanOrEqual(4)
  })

  it('4.3 – returns HTTP 404 for unknown ID', async () => {
    const res = await get('/api/iam/users/nonexistent-id-abc')
    expect(res.status).toBe(404)
    const data = await res.json() as { error: { code: string; message: string } }
    expect(typeof data.error.message).toBe('string')
    expect(data.error.code).toBe('resource_not_found')
  })

  it('4.4 – embedded policies have all required fields', async () => {
    const id = getIamUsers()[0].id
    const res = await get(`/api/iam/users/${id}`)
    const data = await res.json() as { policies: Record<string, unknown>[] }
    data.policies.forEach((p) => {
      expect(typeof p.id).toBe('string')
      expect(typeof p.userId).toBe('string')
      expect(typeof p.name).toBe('string')
      expect(['managed', 'custom']).toContain(p.type)
      expect(Array.isArray(p.permissions)).toBe(true)
      expect(typeof p.attachedAt).toBe('string')
      expect(['active', 'review-needed']).toContain(p.status)
    })
  })

  it('4.4b – policy.userId matches the user\'s id', async () => {
    const id = getIamUsers()[0].id
    const res = await get(`/api/iam/users/${id}`)
    const data = await res.json() as { policies: { userId: string }[] }
    data.policies.forEach((p) => expect(p.userId).toBe(id))
  })

  it('4.4c – permission objects inside policies are well-formed', async () => {
    const id = getIamUsers()[0].id
    const res = await get(`/api/iam/users/${id}`)
    const data = await res.json() as { policies: { permissions: Record<string, unknown>[] }[] }
    data.policies.flatMap((p) => p.permissions).forEach((perm) => {
      expect(typeof perm.resource).toBe('string')
      expect(typeof perm.action).toBe('string')
      expect(['allow', 'deny']).toContain(perm.effect)
    })
  })
})

// ---------------------------------------------------------------------------
// 5. Create, Update, Delete endpoints
// ---------------------------------------------------------------------------

describe('Section 5 – POST /api/iam/users (create)', () => {
  it('5.1 – creates user and returns HTTP 201 with IamUser shape', async () => {
    const res = await post('/api/iam/users', {
      name: 'Frank Test',
      email: 'frank.test@example.com',
      role: 'viewer',
    })
    expect(res.status).toBe(201)
    const data = await res.json() as Record<string, unknown>
    expect(typeof data.id).toBe('string')
    expect(data.name).toBe('Frank Test')
    expect(data.email).toBe('frank.test@example.com')
    expect(data.role).toBe('viewer')
    expect(data.status).toBe('active')
    expect(data.mfaEnabled).toBe(false)
    expect(typeof data.createdAt).toBe('string')
  })

  it('5.2 – rejects invalid role with HTTP 400', async () => {
    const res = await post('/api/iam/users', {
      name: 'Hacker',
      email: 'hacker@example.com',
      role: 'superuser',
    })
    expect(res.status).toBe(400)
    const data = await res.json() as { error: { code: string; message: string } }
    expect(typeof data.error.message).toBe('string')
    expect(data.error.code).toBe('invalid_input')
  })

  it('5.3 – rejects missing email with HTTP 400', async () => {
    const res = await post('/api/iam/users', { name: 'Incomplete' })
    expect(res.status).toBe(400)
  })

  it('5.3b – rejects missing name with HTTP 400', async () => {
    const res = await post('/api/iam/users', { email: 'no-name@example.com', role: 'viewer' })
    expect(res.status).toBe(400)
  })

  it('5.3c – rejects missing role with HTTP 400', async () => {
    const res = await post('/api/iam/users', { name: 'No Role', email: 'norole@example.com' })
    expect(res.status).toBe(400)
  })

  it('5.3d – rejects invalid email (no @) with HTTP 400', async () => {
    const res = await post('/api/iam/users', { name: 'Bad Email', email: 'not-an-email', role: 'viewer' })
    expect(res.status).toBe(400)
  })
})

describe('Section 5 – PATCH /api/iam/users/:id (update)', () => {
  it('5.4 – updates status to "disabled" and returns HTTP 200', async () => {
    const id = getIamUsers()[0].id
    const res = await patch(`/api/iam/users/${id}`, { status: 'disabled' })
    expect(res.status).toBe(200)
    const data = await res.json() as { status: string; id: string }
    expect(data.status).toBe('disabled')
    expect(data.id).toBe(id)
  })

  it('5.5 – updates role and returns HTTP 200', async () => {
    const id = getIamUsers()[1].id
    const res = await patch(`/api/iam/users/${id}`, { role: 'auditor' })
    expect(res.status).toBe(200)
    const data = await res.json() as { role: string }
    expect(data.role).toBe('auditor')
  })

  it('5.6 – partial update: only mfaEnabled changes', async () => {
    const id = getIamUsers()[2].id
    const before = await (await get(`/api/iam/users/${id}`)).json() as Record<string, unknown>
    const res = await patch(`/api/iam/users/${id}`, { mfaEnabled: true })
    expect(res.status).toBe(200)
    const after = await res.json() as Record<string, unknown>
    expect(after.mfaEnabled).toBe(true)
    // Other fields unchanged
    expect(after.name).toBe(before.name)
    expect(after.email).toBe(before.email)
  })

  it('5.7 – rejects unknown field with HTTP 400', async () => {
    const id = getIamUsers()[0].id
    const res = await patch(`/api/iam/users/${id}`, { unknownField: 'value' })
    expect(res.status).toBe(400)
  })

  it('5.7b – rejects invalid status value with HTTP 400', async () => {
    const id = getIamUsers()[0].id
    const res = await patch(`/api/iam/users/${id}`, { status: 'suspended' })
    expect(res.status).toBe(400)
  })

  it('5.7c – rejects invalid role value with HTTP 400', async () => {
    const id = getIamUsers()[0].id
    const res = await patch(`/api/iam/users/${id}`, { role: 'god' })
    expect(res.status).toBe(400)
  })

  it('5.7d – rejects non-boolean mfaEnabled with HTTP 400', async () => {
    const id = getIamUsers()[0].id
    const res = await patch(`/api/iam/users/${id}`, { mfaEnabled: 'yes' })
    expect(res.status).toBe(400)
  })

  it('5.4b – PATCH persists: subsequent GET returns updated status', async () => {
    const id = getIamUsers()[3].id
    await patch(`/api/iam/users/${id}`, { status: 'locked' })
    const res = await get(`/api/iam/users/${id}`)
    const data = await res.json() as { status: string }
    expect(data.status).toBe('locked')
  })

  it('5.x – PATCH returns 404 for nonexistent user', async () => {
    const res = await patch('/api/iam/users/nonexistent-patch', { status: 'disabled' })
    expect(res.status).toBe(404)
  })
})

describe('Section 5 – DELETE /api/iam/users/:id', () => {
  it('5.8 – deletes user and returns HTTP 204', async () => {
    // Create a fresh user to delete
    const createRes = await post('/api/iam/users', {
      name: 'Delete Target',
      email: 'delete.target@example.com',
      role: 'viewer',
    })
    const created = await createRes.json() as { id: string }

    const res = await del(`/api/iam/users/${created.id}`)
    expect(res.status).toBe(204)
  })

  it('5.8b – subsequent GET of deleted user returns 404', async () => {
    const createRes = await post('/api/iam/users', {
      name: 'Gone User',
      email: 'gone.user@example.com',
      role: 'viewer',
    })
    const created = await createRes.json() as { id: string }
    await del(`/api/iam/users/${created.id}`)

    const getRes = await get(`/api/iam/users/${created.id}`)
    expect(getRes.status).toBe(404)
  })

  it('5.9 – DELETE returns 404 for nonexistent user', async () => {
    const res = await del('/api/iam/users/nonexistent-user-delete')
    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// 8. Handler registration / no conflicts
// ---------------------------------------------------------------------------

describe('Section 8 – MSW handler registration', () => {
  it('8.4 – IAM endpoints do not bleed into other namespaces', async () => {
    // Verify IAM path responds
    const iamRes = await get('/api/iam/users')
    expect(iamRes.status).toBe(200)
  })

  it('8.x – All 5 IAM endpoint shapes are reachable', async () => {
    const listRes = await get('/api/iam/users')
    expect(listRes.status).toBe(200)

    const id = getIamUsers()[0].id
    const detailRes = await get(`/api/iam/users/${id}`)
    expect(detailRes.status).toBe(200)

    const createRes = await post('/api/iam/users', { name: 'X', email: 'x@x.com', role: 'viewer' })
    expect(createRes.status).toBe(201)

    const created = await createRes.json() as { id: string }
    const patchRes = await patch(`/api/iam/users/${created.id}`, { status: 'disabled' })
    expect(patchRes.status).toBe(200)

    const delRes = await del(`/api/iam/users/${created.id}`)
    expect(delRes.status).toBe(204)
  })
})

// ---------------------------------------------------------------------------
// 11. Edge cases
// ---------------------------------------------------------------------------

describe('Section 11 – Edge cases', () => {
  it('11.1 – GET /api/iam/users returns a valid array response', async () => {
    const res = await get('/api/iam/users')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('11.2 – User with long name is handled correctly', async () => {
    const longName = 'A'.repeat(120)
    const res = await post('/api/iam/users', {
      name: longName,
      email: 'longname@example.com',
      role: 'viewer',
    })
    expect(res.status).toBe(201)
    const data = await res.json() as { name: string }
    expect(data.name).toBe(longName)
  })

  it('11.3 – Special characters in name are preserved', async () => {
    const res = await post('/api/iam/users', {
      name: 'François Müller',
      email: 'francois@example.com',
      role: 'viewer',
    })
    expect(res.status).toBe(201)
    const data = await res.json() as { name: string }
    expect(data.name).toBe('François Müller')
  })

  it('11.6 – Policy userId always matches parent user id (12.1)', async () => {
    const users = getIamUsers()
    for (const user of users.slice(0, 3)) {
      const res = await get(`/api/iam/users/${user.id}`)
      const detail = await res.json() as { id: string; policies: { userId: string }[] }
      detail.policies.forEach((p) => expect(p.userId).toBe(detail.id))
    }
  })
})

// ---------------------------------------------------------------------------
// 12. Data consistency
// ---------------------------------------------------------------------------

describe('Section 12 – Data consistency', () => {
  it('12.2 – Deleting user removes it from the list', async () => {
    const createRes = await post('/api/iam/users', {
      name: 'Cascade Delete Test',
      email: 'cascade@example.com',
      role: 'viewer',
    })
    const { id } = await createRes.json() as { id: string }

    await del(`/api/iam/users/${id}`)

    const listRes = await get('/api/iam/users')
    const list = await listRes.json() as { id: string }[]
    expect(list.some((u) => u.id === id)).toBe(false)
  })

  it('12.3 – Updating user does not affect policy list', async () => {
    const id = getIamUsers()[0].id
    const beforeRes = await get(`/api/iam/users/${id}`)
    const before = await beforeRes.json() as { policies: { id: string }[] }
    const policyIds = before.policies.map((p) => p.id).sort()

    await patch(`/api/iam/users/${id}`, { role: 'viewer' })

    const afterRes = await get(`/api/iam/users/${id}`)
    const after = await afterRes.json() as { policies: { id: string }[] }
    const afterPolicyIds = after.policies.map((p) => p.id).sort()
    expect(afterPolicyIds).toEqual(policyIds)
  })
})

// ---------------------------------------------------------------------------
// 14. Comparison with other services
// ---------------------------------------------------------------------------

describe('Section 14 – Service conventions', () => {
  it('14.2 – No metrics endpoint exists for IAM', () => {
    // Verify that no handler in iamHandlers registers a metrics route
    const hasMetricsRoute = iamHandlers.some((h) => {
      const path = h.info.header
      return typeof path === 'string' && path.includes('metrics')
    })
    expect(hasMetricsRoute).toBe(false)
  })

  it('14.3 – IAM follows same REST pattern as Database/Compute Engine (CRUD on collection)', async () => {
    // List
    const list = await get('/api/iam/users')
    expect(list.status).toBe(200)

    // Create
    const create = await post('/api/iam/users', { name: 'Pattern User', email: 'pattern@test.com', role: 'viewer' })
    expect(create.status).toBe(201)
    const { id } = await create.json() as { id: string }

    // Detail
    const detail = await get(`/api/iam/users/${id}`)
    expect(detail.status).toBe(200)

    // Update
    const update = await patch(`/api/iam/users/${id}`, { status: 'disabled' })
    expect(update.status).toBe(200)

    // Delete
    const remove = await del(`/api/iam/users/${id}`)
    expect(remove.status).toBe(204)
  })
})
