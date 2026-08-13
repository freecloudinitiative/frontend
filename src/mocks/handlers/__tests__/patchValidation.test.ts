/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §3.4, §7.7
 *
 * The audit explicitly recommended NOT refactoring PATCH/validation logic (destructive-keyword
 * blocking in SQL execute, enum validation in Compute Engine/Database/IAM PATCH) — it's
 * domain-specific enough per-resource that forcing it into a shared factory would add more
 * complexity than it removes. This suite exists to catch collateral damage: since finding 1.6's
 * createListHandler touches the same handler files as this validation logic, a bad refactor
 * could accidentally lift or break it even though nothing here was meant to change.
 */
import { describe, it, expect } from 'vitest'
import { setupServer } from 'msw/node'
import { computeEngineHandlers } from '@/mocks/handlers/computeEngine'
import { databaseHandlers } from '@/mocks/handlers/database'
import { iamHandlers } from '@/mocks/handlers/iam'
import { getComputeEngines } from '@/mocks/data/computeEngines'
import { getDatabases } from '@/mocks/data/databases'
import { getIamUsers } from '@/mocks/data/iamUsers'

describe('Database SQL execute — destructive keyword blocking (unchanged by refactor)', () => {
  const server = setupServer(...databaseHandlers)

  it('rejects a DROP statement with HTTP 403', async () => {
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const id = getDatabases()[0].id
      const res = await fetch(`http://localhost/api/databases/${id}/execute-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: 'DROP TABLE users' }),
      })
      expect(res.status).toBe(403)
    } finally {
      server.close()
    }
  })

  it('rejects a TRUNCATE statement with HTTP 403', async () => {
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const id = getDatabases()[0].id
      const res = await fetch(`http://localhost/api/databases/${id}/execute-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: 'TRUNCATE users' }),
      })
      expect(res.status).toBe(403)
    } finally {
      server.close()
    }
  })

  it('accepts a normal SELECT statement with HTTP 200', async () => {
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const id = getDatabases()[0].id
      const res = await fetch(`http://localhost/api/databases/${id}/execute-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: 'SELECT * FROM users' }),
      })
      expect(res.status).toBe(200)
    } finally {
      server.close()
    }
  })
})

describe('Compute Engine PATCH — enum validation (unchanged by refactor)', () => {
  const server = setupServer(...computeEngineHandlers)

  it('rejects an invalid status value with HTTP 400', async () => {
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const id = getComputeEngines()[0].id
      const res = await fetch(`http://localhost/api/compute-engines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'not-a-real-status' }),
      })
      expect(res.status).toBe(400)
    } finally {
      server.close()
    }
  })

  it('accepts a valid status transition with HTTP 200', async () => {
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const id = getComputeEngines()[0].id
      const res = await fetch(`http://localhost/api/compute-engines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'stopped' }),
      })
      expect(res.status).toBe(200)
    } finally {
      server.close()
    }
  })
})

describe('IAM PATCH — enum validation (unchanged by refactor)', () => {
  const server = setupServer(...iamHandlers)

  it('rejects an invalid role value with HTTP 400', async () => {
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const id = getIamUsers()[0].id
      const res = await fetch(`http://localhost/api/iam/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'super-admin-999' }),
      })
      expect(res.status).toBe(400)
    } finally {
      server.close()
    }
  })

  it('rejects an invalid status value with HTTP 400', async () => {
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const id = getIamUsers()[0].id
      const res = await fetch(`http://localhost/api/iam/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'quantum-superposition' }),
      })
      expect(res.status).toBe(400)
    } finally {
      server.close()
    }
  })

  it('accepts a valid role/status transition with HTTP 200', async () => {
    server.listen({ onUnhandledRequest: 'error' })
    try {
      const id = getIamUsers()[0].id
      const res = await fetch(`http://localhost/api/iam/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'editor', status: 'active' }),
      })
      expect(res.status).toBe(200)
    } finally {
      server.close()
    }
  })
})
