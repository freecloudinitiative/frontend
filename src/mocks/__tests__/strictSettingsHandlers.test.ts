import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import {
  COMPUTE_ENGINE_UPDATE_KEYS,
  computeEngineHandlers,
} from '@/mocks/handlers/computeEngine'
import { DATABASE_UPDATE_KEYS, databaseHandlers } from '@/mocks/handlers/database'
import { BUCKET_SETTINGS_UPDATE_KEYS, storageHandlers } from '@/mocks/handlers/storage'
import { NETWORK_SETTINGS_UPDATE_KEYS, networkHandlers } from '@/mocks/handlers/network'
import { IAM_USER_UPDATE_KEYS, iamHandlers } from '@/mocks/handlers/iam'
import {
  getComputeEngines,
  resetComputeEngineStore,
} from '@/mocks/data/computeEngines'
import { getDatabases, resetDatabaseStore } from '@/mocks/data/databases'
import { getBuckets, resetBucketStore } from '@/mocks/data/buckets'
import { getNetworks, resetNetworkStore } from '@/mocks/data/networks'
import { getIamUsers, resetIamUserStore } from '@/mocks/data/iamUsers'
import { decodeStrict } from '@/mocks/lib/strictBody'

const server = setupServer(
  ...computeEngineHandlers,
  ...databaseHandlers,
  ...storageHandlers,
  ...networkHandlers,
  ...iamHandlers,
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  resetComputeEngineStore()
  resetDatabaseStore()
  resetBucketStore()
  resetNetworkStore()
  resetIamUserStore()
})
afterAll(() => server.close())

async function patch(path: string, body: unknown) {
  return fetch(`http://localhost${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

interface SettingsCase {
  name: string
  path: () => string
  knownBody: () => Record<string, unknown>
  expectedMutation: () => Record<string, unknown>
  current: () => object
}

const settingsCases: SettingsCase[] = [
  {
    name: 'compute engine',
    path: () => `/api/compute-engines/${getComputeEngines()[0].id}/settings`,
    knownBody: () => ({ autoBackups: !getComputeEngines()[0].autoBackups }),
    expectedMutation: () => ({ autoBackups: !getComputeEngines()[0].autoBackups }),
    current: () => getComputeEngines()[0],
  },
  {
    name: 'database',
    path: () => `/api/databases/${getDatabases()[0].id}/settings`,
    knownBody: () => ({ cpu: getDatabases()[0].cpu === 8 ? 4 : 8 }),
    expectedMutation: () => ({ cpu: getDatabases()[0].cpu === 8 ? 4 : 8 }),
    current: () => getDatabases()[0],
  },
  {
    name: 'bucket',
    path: () => `/api/buckets/${getBuckets()[0].id}/settings`,
    knownBody: () => ({ versioning: !getBuckets()[0].versioning }),
    expectedMutation: () => ({ versioning: !getBuckets()[0].versioning }),
    current: () => getBuckets()[0],
  },
  {
    name: 'network',
    path: () => `/api/networks/${getNetworks()[0].id}/settings`,
    knownBody: () => ({ gateway: '10.250.0.1' }),
    expectedMutation: () => ({ gateway: '10.250.0.1' }),
    current: () => getNetworks()[0],
  },
  {
    name: 'IAM user',
    path: () => `/api/iam/users/${getIamUsers()[0].id}/settings`,
    knownBody: () => ({ mfaEnabled: !getIamUsers()[0].mfaEnabled }),
    expectedMutation: () => ({ mfaEnabled: !getIamUsers()[0].mfaEnabled }),
    current: () => getIamUsers()[0],
  },
]

describe.each(settingsCases)('$name settings strict body contract', (resource) => {
  it('accepts a known key and applies the mutation', async () => {
    const expected = resource.expectedMutation()
    const response = await patch(resource.path(), resource.knownBody())

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(expected)
    expect(resource.current()).toMatchObject(expected)
  })

  it('rejects one unknown key with the service error envelope', async () => {
    const response = await patch(resource.path(), { hostname: 'not-supported' })
    const body = await response.json() as { error: { code: string; message: string } }

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('invalid_input')
    expect(body.error.message).toBe('invalid request body: json: unknown field "hostname"')
  })

  it('reports every unknown key', async () => {
    const response = await patch(resource.path(), {
      hostname: 'not-supported',
      tags: ['drift'],
      quota: 3,
    })
    const body = await response.json() as { error: { code: string; message: string } }

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('invalid_input')
    expect(body.error.message).toContain('json: unknown field "hostname"')
    expect(body.error.message).toContain('json: unknown field "tags"')
    expect(body.error.message).toContain('json: unknown field "quota"')
  })

  it('accepts an empty object without changing the resource', async () => {
    const before = structuredClone(resource.current())
    const response = await patch(resource.path(), {})

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(before)
    expect(resource.current()).toEqual(before)
  })
})

describe('bare PATCH routes share the strict update contract', () => {
  it.each([
    ['compute engine', () => `/api/compute-engines/${getComputeEngines()[0].id}`],
    ['database', () => `/api/databases/${getDatabases()[0].id}`],
    ['IAM user', () => `/api/iam/users/${getIamUsers()[0].id}`],
  ] as const)('rejects all unknown keys for %s', async (_name, path) => {
    const response = await patch(path(), { hostname: 'drift', tags: [] })
    const body = await response.json() as { error: { code: string; message: string } }

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('invalid_input')
    expect(body.error.message).toContain('json: unknown field "hostname"')
    expect(body.error.message).toContain('json: unknown field "tags"')
  })
})

describe('allowed-key contract mirrors', () => {
  it('exactly matches the authoritative backend update fields', () => {
    expect(COMPUTE_ENGINE_UPDATE_KEYS).toEqual([
      'name', 'status', 'cpu', 'memory', 'disk', 'os', 'autoBackups',
    ])
    expect(DATABASE_UPDATE_KEYS).toEqual([
      'name', 'status', 'cpu', 'memory', 'storageSize', 'backupStatus',
    ])
    expect(BUCKET_SETTINGS_UPDATE_KEYS).toEqual([
      'access', 'versioning', 'lifecycleEnabled', 'status', 'publicReadAccess', 'confirmPublic',
    ])
    expect(NETWORK_SETTINGS_UPDATE_KEYS).toEqual(['vpcName', 'status', 'gateway'])
    expect(IAM_USER_UPDATE_KEYS).toEqual(['status', 'role', 'mfaEnabled'])
  })

  it.each([
    ['compute engine', COMPUTE_ENGINE_UPDATE_KEYS, ['autoBackups']],
    ['database', DATABASE_UPDATE_KEYS, ['cpu', 'memory', 'storageSize', 'status']],
    ['bucket', BUCKET_SETTINGS_UPDATE_KEYS, ['versioning', 'publicReadAccess']],
    ['network', NETWORK_SETTINGS_UPDATE_KEYS, ['gateway']],
    ['IAM user', IAM_USER_UPDATE_KEYS, ['mfaEnabled']],
  ] as const)('contains every key sent by the %s settings page', (_name, allowed, pageKeys) => {
    expect(pageKeys.every((key) => (allowed as readonly string[]).includes(key))).toBe(true)
  })
})

describe('decodeStrict', () => {
  it('returns every unknown key in request order', () => {
    expect(decodeStrict({ allowed: 1, first: 2, second: 3 }, ['allowed'])).toEqual({
      ok: false,
      unknown: ['first', 'second'],
    })
  })
})
