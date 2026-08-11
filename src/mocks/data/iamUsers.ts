import { faker } from '@faker-js/faker'
import type { CreateIamUserInput, IamPolicy, IamUser, IamUserWithPolicies, UpdateIamUserInput } from '@/features/iam/types'

faker.seed(99)

const REGIONS = ['ANK', 'IST'] as const

const ZONE_SUFFIXES = ['1', '2'] as const

function regionToZone(region: string): string {
  return `${region.toLowerCase()}-${faker.helpers.arrayElement(ZONE_SUFFIXES)}`
}

// ---------------------------------------------------------------------------
// Policy generation helpers
// ---------------------------------------------------------------------------

const MANAGED_POLICY_TEMPLATES = [
  {
    name: 'ReadOnlyAccess',
    permissions: [
      { resource: '*', action: 'Get*', effect: 'allow' as const },
      { resource: '*', action: 'List*', effect: 'allow' as const },
      { resource: '*', action: 'Describe*', effect: 'allow' as const },
    ],
  },
  {
    name: 'AdministratorAccess',
    permissions: [{ resource: '*', action: '*', effect: 'allow' as const }],
  },
  {
    name: 'VMFullAccess',
    permissions: [
      { resource: 'vm:*', action: 'Create', effect: 'allow' as const },
      { resource: 'vm:*', action: 'Delete', effect: 'allow' as const },
      { resource: 'vm:*', action: 'Start', effect: 'allow' as const },
      { resource: 'vm:*', action: 'Stop', effect: 'allow' as const },
    ],
  },
  {
    name: 'DatabaseReadOnly',
    permissions: [
      { resource: 'database:*', action: 'Get', effect: 'allow' as const },
      { resource: 'database:*', action: 'List', effect: 'allow' as const },
    ],
  },
  {
    name: 'StorageFullAccess',
    permissions: [
      { resource: 'storage:bucket:*', action: '*', effect: 'allow' as const },
    ],
  },
  {
    name: 'AuditLogAccess',
    permissions: [
      { resource: 'audit:logs:*', action: 'Get', effect: 'allow' as const },
      { resource: 'audit:logs:*', action: 'List', effect: 'allow' as const },
    ],
  },
] as const

const CUSTOM_POLICY_TEMPLATES = [
  {
    name: 'CustomNetworkAccess',
    permissions: [
      { resource: 'network:vpc:*', action: 'Get', effect: 'allow' as const },
      { resource: 'network:firewall:*', action: 'Get', effect: 'allow' as const },
      { resource: 'network:firewall:*', action: 'Update', effect: 'allow' as const, condition: 'region=ANK' },
    ],
  },
  {
    name: 'LimitedIAMAccess',
    permissions: [
      { resource: 'iam:user:*', action: 'Get', effect: 'allow' as const },
      { resource: 'iam:user:*', action: 'List', effect: 'allow' as const },
      { resource: 'iam:user:*', action: 'Delete', effect: 'deny' as const },
    ],
  },
  {
    name: 'ProdDatabaseOnly',
    permissions: [
      { resource: 'database:prod-*', action: '*', effect: 'allow' as const },
      { resource: 'database:staging-*', action: '*', effect: 'deny' as const },
    ],
  },
  {
    name: 'BillingViewOnly',
    permissions: [
      { resource: 'billing:invoice:*', action: 'Get', effect: 'allow' as const },
      { resource: 'billing:invoice:*', action: 'Export', effect: 'allow' as const, condition: 'mfa=true' },
    ],
  },
] as const

function generatePolicies(userId: string, count: number): IamPolicy[] {
  const managedCount = faker.number.int({ min: 1, max: Math.min(count, 2) })
  const customCount = count - managedCount

  const selectedManaged = faker.helpers.arrayElements([...MANAGED_POLICY_TEMPLATES], managedCount)
  const selectedCustom = faker.helpers.arrayElements([...CUSTOM_POLICY_TEMPLATES], customCount)

  const managed: IamPolicy[] = selectedManaged.map((tpl) => ({
    id: faker.string.uuid(),
    userId,
    name: tpl.name,
    type: 'managed' as const,
    permissions: [...tpl.permissions],
    attachedAt: faker.date.past({ years: 1 }).toISOString(),
    status: faker.helpers.weightedArrayElement([
      { value: 'active' as const, weight: 8 },
      { value: 'review-needed' as const, weight: 2 },
    ]),
  }))

  const custom: IamPolicy[] = selectedCustom.map((tpl) => ({
    id: faker.string.uuid(),
    userId,
    name: tpl.name,
    type: 'custom' as const,
    permissions: [...tpl.permissions],
    attachedAt: faker.date.past({ years: 1 }).toISOString(),
    status: faker.helpers.weightedArrayElement([
      { value: 'active' as const, weight: 7 },
      { value: 'review-needed' as const, weight: 3 },
    ]),
  }))

  return [...managed, ...custom]
}

// ---------------------------------------------------------------------------
// User generation
// ---------------------------------------------------------------------------

interface StoredUser {
  user: IamUser
  policies: IamPolicy[]
}

function generateUser(): StoredUser {
  const id = faker.string.uuid()
  const role = faker.helpers.weightedArrayElement([
    { value: 'admin' as const, weight: 1 },
    { value: 'editor' as const, weight: 3 },
    { value: 'viewer' as const, weight: 4 },
    { value: 'auditor' as const, weight: 2 },
  ])
  const policyCount = faker.number.int({ min: 2, max: 4 })

  const user: IamUser = {
    id,
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    status: faker.helpers.weightedArrayElement([
      { value: 'active' as const, weight: 7 },
      { value: 'disabled' as const, weight: 2 },
      { value: 'locked' as const, weight: 1 },
    ]),
    role,
    lastLogin: faker.date.recent({ days: 30 }).toISOString(),
    mfaEnabled: faker.datatype.boolean({ probability: 0.65 }),
    region: faker.helpers.arrayElement(REGIONS),
    zone: regionToZone(faker.helpers.arrayElement(REGIONS)),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
  }

  return { user, policies: generatePolicies(id, policyCount) }
}

// ---------------------------------------------------------------------------
// Mutable in-memory store
// ---------------------------------------------------------------------------

const SEED_DATA: StoredUser[] = [
  {
    user: {
      id: faker.string.uuid(),
      name: 'Layla Hassan',
      email: 'layla.hassan@freecloudinitiative.io',
      status: 'active',
      role: 'admin',
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      mfaEnabled: true,
      region: 'ANK',
      zone: 'ank-1',
      createdAt: new Date('2024-01-15').toISOString(),
    },
    policies: [],
  },
  {
    user: {
      id: faker.string.uuid(),
      name: 'Keanu Makoa',
      email: 'keanu.makoa@freecloudinitiative.io',
      status: 'active',
      role: 'editor',
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      mfaEnabled: true,
      region: 'IST',
      zone: 'ist-1',
      createdAt: new Date('2024-02-20').toISOString(),
    },
    policies: [],
  },
  {
    user: {
      id: faker.string.uuid(),
      name: 'Amara Okonkwo',
      email: 'amara.okonkwo@freecloudinitiative.io',
      status: 'active',
      role: 'viewer',
      lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      mfaEnabled: false,
      region: 'ANK',
      zone: 'ank-2',
      createdAt: new Date('2024-03-05').toISOString(),
    },
    policies: [],
  },
  {
    user: {
      id: faker.string.uuid(),
      name: 'Dmitri Volkov',
      email: 'dmitri.volkov@freecloudinitiative.io',
      status: 'disabled',
      role: 'editor',
      lastLogin: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      mfaEnabled: false,
      region: 'IST',
      zone: 'ist-2',
      createdAt: new Date('2024-01-28').toISOString(),
    },
    policies: [],
  },
  {
    user: {
      id: faker.string.uuid(),
      name: 'Soo-Yeon Park',
      email: 'soo.yeon.park@freecloudinitiative.io',
      status: 'active',
      role: 'auditor',
      lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      mfaEnabled: true,
      region: 'ANK',
      zone: 'ank-1',
      createdAt: new Date('2024-04-12').toISOString(),
    },
    policies: [],
  },
  {
    user: {
      id: faker.string.uuid(),
      name: 'Tariq Al-Farsi',
      email: 'tariq.alfarsi@freecloudinitiative.io',
      status: 'locked',
      role: 'viewer',
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      mfaEnabled: false,
      region: 'IST',
      zone: 'ist-2',
      createdAt: new Date('2024-05-01').toISOString(),
    },
    policies: [],
  },
]

// Attach policies for seeded users
SEED_DATA.forEach((entry) => {
  const count = faker.number.int({ min: 2, max: 4 })
  entry.policies = generatePolicies(entry.user.id, count)
})

// Add 3 more fully random users
const RANDOM_ENTRIES: StoredUser[] = Array.from({ length: 3 }, () => generateUser())

let iamStore: StoredUser[] = [...SEED_DATA, ...RANDOM_ENTRIES]

// ---------------------------------------------------------------------------
// CRUD functions
// ---------------------------------------------------------------------------

export function getIamUsers(): IamUser[] {
  return iamStore.map((entry) => entry.user)
}

export function getIamUserById(id: string): IamUserWithPolicies | undefined {
  const entry = iamStore.find((e) => e.user.id === id)
  if (!entry) return undefined
  return { ...entry.user, policies: entry.policies }
}

export function createIamUser(input: CreateIamUserInput): IamUser {
  const id = faker.string.uuid()
  const user: IamUser = {
    id,
    name: input.name,
    email: input.email,
    status: 'active',
    role: input.role,
    lastLogin: new Date().toISOString(),
    mfaEnabled: false,
    region: faker.helpers.arrayElement(REGIONS),
    zone: regionToZone(faker.helpers.arrayElement(REGIONS)),
    createdAt: new Date().toISOString(),
  }
  const policies = generatePolicies(id, 2)
  iamStore = [...iamStore, { user, policies }]
  return user
}

export function updateIamUser(id: string, partial: UpdateIamUserInput): IamUser | undefined {
  let updated: IamUser | undefined
  iamStore = iamStore.map((entry) => {
    if (entry.user.id !== id) return entry
    updated = {
      ...entry.user,
      ...(partial.status !== undefined && { status: partial.status }),
      ...(partial.role !== undefined && { role: partial.role }),
      ...(partial.mfaEnabled !== undefined && { mfaEnabled: partial.mfaEnabled }),
    }
    return { ...entry, user: updated }
  })
  return updated
}

export function deleteIamUser(id: string): boolean {
  const before = iamStore.length
  iamStore = iamStore.filter((entry) => entry.user.id !== id)
  return iamStore.length < before
}
