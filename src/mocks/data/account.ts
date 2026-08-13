import { faker } from '@faker-js/faker'

export type AccountRegion = 'ANK' | 'IST'

export interface NotificationPreferences {
  emailAlerts: boolean
  weeklyDigest: boolean
}

export interface ApiKey {
  id: string
  name: string
  createdAt: string
  lastFour: string
}

export interface AccountSettings {
  id: string
  displayName: string
  email: string
  defaultRegion: AccountRegion
  theme: 'beige' | 'mono' | 'default' | 'navy'
  sessionTimeoutMinutes: number
  notifications: NotificationPreferences
  apiKeys: ApiKey[]
}

export interface UpdateAccountSettingsInput {
  displayName?: string
  email?: string
  defaultRegion?: AccountRegion
  theme?: 'beige' | 'mono' | 'default' | 'navy'
  sessionTimeoutMinutes?: number
  notifications?: NotificationPreferences
}

faker.seed(42)

// Mutable in-memory store — GET/PATCH handlers read/write this directly
let accountStore: AccountSettings = {
  id: 'me',
  displayName: 'root',
  email: 'root@freecloudinitiative.dev',
  defaultRegion: 'IST',
  theme: 'default',
  sessionTimeoutMinutes: 60,
  notifications: {
    emailAlerts: true,
    weeklyDigest: false,
  },
  apiKeys: [
    {
      id: faker.string.uuid(),
      name: 'ci-deploy-key',
      createdAt: faker.date.past({ years: 1 }).toISOString(),
      lastFour: faker.string.alphanumeric(4).toLowerCase(),
    },
  ],
}

export function getAccount(): AccountSettings {
  return accountStore
}

export function updateAccount(partial: UpdateAccountSettingsInput): AccountSettings {
  accountStore = {
    ...accountStore,
    ...(partial.displayName !== undefined && { displayName: partial.displayName }),
    ...(partial.email !== undefined && { email: partial.email }),
    ...(partial.defaultRegion !== undefined && { defaultRegion: partial.defaultRegion }),
    ...(partial.theme !== undefined && { theme: partial.theme }),
    ...(partial.sessionTimeoutMinutes !== undefined && { sessionTimeoutMinutes: partial.sessionTimeoutMinutes }),
    ...(partial.notifications !== undefined && { notifications: partial.notifications }),
  }
  return accountStore
}

export function addApiKey(name: string): { apiKey: ApiKey; plaintextSecret: string; apiKeys: ApiKey[] } {
  const secret = `fci_${faker.string.alphanumeric(32)}`
  const apiKey: ApiKey = {
    id: faker.string.uuid(),
    name,
    createdAt: new Date().toISOString(),
    lastFour: secret.slice(-4),
  }
  accountStore = { ...accountStore, apiKeys: [...accountStore.apiKeys, apiKey] }
  return { apiKey, plaintextSecret: secret, apiKeys: accountStore.apiKeys }
}

export function removeApiKey(keyId: string): { removed: boolean; apiKeys: ApiKey[] } {
  const before = accountStore.apiKeys.length
  accountStore = { ...accountStore, apiKeys: accountStore.apiKeys.filter((key) => key.id !== keyId) }
  return { removed: accountStore.apiKeys.length < before, apiKeys: accountStore.apiKeys }
}
