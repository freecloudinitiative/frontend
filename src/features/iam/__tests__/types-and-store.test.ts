/**
 * Scenarios 1.x, 2.x, 3.x
 * Type definitions, mock data generation, and in-memory store CRUD.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import type {
  IamUser,
  IamPolicy,
  IamUserWithPolicies,
  CreateIamUserInput,
  UpdateIamUserInput,
} from '@/features/iam/types'
import {
  getIamUsers,
  getIamUserById,
  createIamUser,
  updateIamUser,
  deleteIamUser,
} from '@/mocks/data/iamUsers'

// ---------------------------------------------------------------------------
// 1. Type Definition sanity checks (compile-time shapes exercised at runtime)
// ---------------------------------------------------------------------------

describe('Section 1 – Type definitions', () => {
  it('1.1 – IamUser has all required fields with correct types', () => {
    const users = getIamUsers()
    expect(users.length).toBeGreaterThan(0)
    const u = users[0]
    expect(typeof u.id).toBe('string')
    expect(typeof u.name).toBe('string')
    expect(typeof u.email).toBe('string')
    expect(['active', 'disabled', 'locked']).toContain(u.status)
    expect(['admin', 'editor', 'viewer', 'auditor']).toContain(u.role)
    expect(typeof u.lastLogin).toBe('string')
    expect(typeof u.mfaEnabled).toBe('boolean')
    expect(typeof u.region).toBe('string')
    expect(typeof u.createdAt).toBe('string')
  })

  it('1.2 – IamPolicy has all required fields with correct types', () => {
    const users = getIamUsers()
    const detail = getIamUserById(users[0].id)
    expect(detail).toBeDefined()
    const policy = detail!.policies[0]
    expect(typeof policy.id).toBe('string')
    expect(typeof policy.userId).toBe('string')
    expect(typeof policy.name).toBe('string')
    expect(['managed', 'custom']).toContain(policy.type)
    expect(Array.isArray(policy.permissions)).toBe(true)
    expect(typeof policy.attachedAt).toBe('string')
    expect(['active', 'review-needed']).toContain(policy.status)
  })

  it('1.3 – Permission object has required fields + optional condition', () => {
    const users = getIamUsers()
    const detail = getIamUserById(users[0].id)!
    const permission = detail.policies.flatMap((p) => p.permissions)[0]
    expect(typeof permission.resource).toBe('string')
    expect(typeof permission.action).toBe('string')
    expect(['allow', 'deny']).toContain(permission.effect)
    // condition is optional — if present it must be a string
    if ('condition' in permission) {
      expect(typeof permission.condition).toBe('string')
    }
  })

  it('1.4 – IamUserWithPolicies extends IamUser with policies array', () => {
    const users = getIamUsers()
    const detail = getIamUserById(users[0].id)!
    // All base IamUser fields present
    expect(typeof detail.id).toBe('string')
    expect(typeof detail.name).toBe('string')
    // Extra field
    expect(Array.isArray(detail.policies)).toBe(true)
  })

  it('1.5 – CreateIamUserInput has only name, email, role', () => {
    // Structural check via actual usage
    const input: CreateIamUserInput = { name: 'Test User', email: 'test@example.com', role: 'viewer' }
    expect(input.name).toBe('Test User')
    expect(input.email).toBe('test@example.com')
    expect(input.role).toBe('viewer')
    // TypeScript enforces no extra/missing fields at compile time
  })

  it('1.6 – UpdateIamUserInput fields are all optional', () => {
    const partial: UpdateIamUserInput = {}
    expect(Object.keys(partial).length).toBe(0)
    const full: UpdateIamUserInput = { status: 'disabled', role: 'editor', mfaEnabled: true }
    expect(full.status).toBe('disabled')
  })
})

// ---------------------------------------------------------------------------
// 2. Mock data generation
// ---------------------------------------------------------------------------

describe('Section 2 – Mock IAM data generation', () => {
  it('2.1 – 8-10 realistic IAM users are generated', () => {
    const users = getIamUsers()
    expect(users.length).toBeGreaterThanOrEqual(8)
    expect(users.length).toBeLessThanOrEqual(10)
  })

  it('2.3 – User names look like real person names (first + last)', () => {
    const users = getIamUsers()
    users.forEach((u) => {
      const parts = u.name.trim().split(' ')
      expect(parts.length).toBeGreaterThanOrEqual(2)
      parts.forEach((part) => expect(part.length).toBeGreaterThan(0))
    })
  })

  it('2.4 – Emails are valid and unique', () => {
    const users = getIamUsers()
    const emails = users.map((u) => u.email)
    emails.forEach((e) => expect(e).toMatch(/@/))
    const unique = new Set(emails)
    expect(unique.size).toBe(emails.length)
  })

  it('2.5 – Mixed user roles across the dataset', () => {
    const users = getIamUsers()
    const roles = new Set(users.map((u) => u.role))
    expect(roles.size).toBeGreaterThanOrEqual(2)
  })

  it('2.6 – All statuses are within allowed enum values', () => {
    const users = getIamUsers()
    users.forEach((u) => {
      expect(['active', 'disabled', 'locked']).toContain(u.status)
    })
  })

  it('2.7 – MFA is a mix of true and false values', () => {
    const users = getIamUsers()
    const withMfa = users.filter((u) => u.mfaEnabled)
    const withoutMfa = users.filter((u) => !u.mfaEnabled)
    // At least some users should have MFA both enabled and disabled
    expect(withMfa.length).toBeGreaterThan(0)
    expect(withoutMfa.length).toBeGreaterThan(0)
  })

  it('2.8 – Regions are assigned (non-empty strings)', () => {
    const users = getIamUsers()
    users.forEach((u) => {
      expect(typeof u.region).toBe('string')
      expect(u.region.length).toBeGreaterThan(0)
    })
  })

  it('2.9 – Timestamps are ISO 8601 strings', () => {
    const users = getIamUsers()
    users.forEach((u) => {
      expect(new Date(u.createdAt).toISOString()).toBe(u.createdAt)
      expect(new Date(u.lastLogin).toISOString()).toBe(u.lastLogin)
    })
  })

  it('2.10 – Each user has 2-4 policies in detail view', () => {
    const users = getIamUsers()
    users.forEach((u) => {
      const detail = getIamUserById(u.id)!
      expect(detail.policies.length).toBeGreaterThanOrEqual(2)
      expect(detail.policies.length).toBeLessThanOrEqual(4)
    })
  })

  it('2.11 – Policy permissions contain valid resource / action / effect', () => {
    const users = getIamUsers()
    const allPolicies = users.flatMap((u) => getIamUserById(u.id)!.policies)
    allPolicies.forEach((policy) => {
      policy.permissions.forEach((perm) => {
        expect(typeof perm.resource).toBe('string')
        expect(typeof perm.action).toBe('string')
        expect(['allow', 'deny']).toContain(perm.effect)
      })
    })
  })
})

// ---------------------------------------------------------------------------
// 3. In-memory store CRUD
// ---------------------------------------------------------------------------

describe('Section 3 – In-memory store functions', () => {
  it('3.1 – getIamUsers() returns full list without policies field', () => {
    const users = getIamUsers()
    expect(Array.isArray(users)).toBe(true)
    expect(users.length).toBeGreaterThanOrEqual(8)
    users.forEach((u) => {
      expect('policies' in u).toBe(false)
    })
  })

  it('3.2 – getIamUserById() returns user with embedded policies', () => {
    const id = getIamUsers()[0].id
    const detail = getIamUserById(id)
    expect(detail).toBeDefined()
    expect(detail!.id).toBe(id)
    expect(Array.isArray(detail!.policies)).toBe(true)
  })

  it('3.3 – getIamUserById() returns undefined for unknown ID', () => {
    const result = getIamUserById('definitely-does-not-exist')
    expect(result).toBeUndefined()
  })

  it('3.4 – createIamUser() adds new user with correct defaults', () => {
    const beforeCount = getIamUsers().length
    const created = createIamUser({ name: 'Eve Test', email: 'eve@example.com', role: 'editor' })
    const afterCount = getIamUsers().length

    expect(afterCount).toBe(beforeCount + 1)
    expect(created.id).toBeTruthy()
    expect(created.name).toBe('Eve Test')
    expect(created.email).toBe('eve@example.com')
    expect(created.role).toBe('editor')
    expect(created.status).toBe('active')
    expect(created.mfaEnabled).toBe(false)
    expect(typeof created.region).toBe('string')
    expect(() => new Date(created.createdAt)).not.toThrow()
  })

  it('3.5 – createIamUser() generates unique IDs for each user', () => {
    const a = createIamUser({ name: 'A User', email: 'a@example.com', role: 'viewer' })
    const b = createIamUser({ name: 'B User', email: 'b@example.com', role: 'viewer' })
    expect(a.id).not.toBe(b.id)
  })

  it('3.6 – deleteIamUser() removes user from store', () => {
    const created = createIamUser({ name: 'To Delete', email: 'delete@example.com', role: 'viewer' })
    const id = created.id
    const deleted = deleteIamUser(id)
    expect(deleted).toBe(true)
    expect(getIamUserById(id)).toBeUndefined()
  })

  it('3.7 – deleteIamUser() returns false for unknown ID', () => {
    const result = deleteIamUser('nonexistent-xyz')
    expect(result).toBe(false)
  })

  it('3.8 – updateIamUser() updates only specified fields', () => {
    const created = createIamUser({ name: 'Update Me', email: 'update@example.com', role: 'viewer' })
    const updated = updateIamUser(created.id, { status: 'disabled', role: 'editor' })

    expect(updated).toBeDefined()
    expect(updated!.status).toBe('disabled')
    expect(updated!.role).toBe('editor')
    // Name unchanged
    expect(updated!.name).toBe('Update Me')
    expect(updated!.email).toBe('update@example.com')
  })

  it('3.9 – Store mutations persist: created user appears in getIamUsers()', () => {
    const created = createIamUser({ name: 'Persisted User', email: 'persist@example.com', role: 'auditor' })
    const list = getIamUsers()
    expect(list.some((u) => u.id === created.id)).toBe(true)
  })

  it('3.10 – updateIamUser() returns undefined for unknown ID', () => {
    const result = updateIamUser('nonexistent-id', { status: 'locked' })
    expect(result).toBeUndefined()
  })
})
