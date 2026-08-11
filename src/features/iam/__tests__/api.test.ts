/**
 * Scenarios 6.x — Axios API layer
 * Verifies each api.ts function calls the correct endpoint and returns
 * the correctly-typed response, backed by the MSW Node server.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'
import { getIamUsers as getMockUsers } from '@/mocks/data/iamUsers'
import {
  getIamUsers,
  getIamUser,
  createIamUser,
  deleteIamUser,
  patchIamUser,
} from '@/features/iam/api'
import type { IamUser, IamUserWithPolicies } from '@/features/iam/types'

// axios uses the same base URL as the MSW Node server intercepts all fetch/XHR
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Section 6 – Axios API layer', () => {
  it('6.1 – getIamUsers() returns array of IamUser', async () => {
    const users: IamUser[] = await getIamUsers()
    expect(Array.isArray(users)).toBe(true)
    expect(users.length).toBeGreaterThanOrEqual(8)
    const u = users[0]
    expect(typeof u.id).toBe('string')
    expect(typeof u.name).toBe('string')
    expect(['active', 'disabled', 'locked']).toContain(u.status)
    expect(['admin', 'editor', 'viewer', 'auditor']).toContain(u.role)
    // No embedded policies in list
    expect('policies' in u).toBe(false)
  })

  it('6.2 – getIamUser(id) returns IamUserWithPolicies with embedded policies', async () => {
    const id = getMockUsers()[0].id
    const detail: IamUserWithPolicies = await getIamUser(id)
    expect(detail.id).toBe(id)
    expect(Array.isArray(detail.policies)).toBe(true)
    expect(detail.policies.length).toBeGreaterThanOrEqual(2)
  })

  it('6.3 – createIamUser() sends payload and returns new IamUser', async () => {
    const input = { name: 'Frank API', email: 'frank.api@example.com', role: 'viewer' as const }
    const user: IamUser = await createIamUser(input)
    expect(typeof user.id).toBe('string')
    expect(user.name).toBe(input.name)
    expect(user.email).toBe(input.email)
    expect(user.role).toBe(input.role)
    expect(user.status).toBe('active')
    expect(user.mfaEnabled).toBe(false)
  })

  it('6.4 – deleteIamUser() resolves without throwing for existing user', async () => {
    const created = await createIamUser({ name: 'Del API', email: 'del.api@example.com', role: 'viewer' })
    await expect(deleteIamUser(created.id)).resolves.toBeUndefined()
  })

  it('6.5 – patchIamUser() sends partial update and returns updated IamUser', async () => {
    const users = await getIamUsers()
    const id = users[0].id
    const updated: IamUser = await patchIamUser(id, { status: 'disabled' })
    expect(updated.id).toBe(id)
    expect(updated.status).toBe('disabled')
  })

  it('6.6 – getIamUser() throws AxiosError for unknown ID', async () => {
    await expect(getIamUser('does-not-exist-xyz')).rejects.toThrow()
  })

  it('6.6b – deleteIamUser() throws AxiosError for unknown ID', async () => {
    await expect(deleteIamUser('does-not-exist-delete')).rejects.toThrow()
  })

  it('6.6c – createIamUser() throws for invalid payload (bad role)', async () => {
    // @ts-expect-error intentional invalid input
    await expect(createIamUser({ name: 'Bad', email: 'bad@test.com', role: 'superuser' })).rejects.toThrow()
  })
})
