import type { ThemeId } from '@/store/themeStore'

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
  theme: ThemeId
  sessionTimeoutMinutes: number
  notifications: NotificationPreferences
  apiKeys: ApiKey[]
}

export interface UpdateAccountSettingsInput {
  displayName?: string
  email?: string
  defaultRegion?: AccountRegion
  theme?: ThemeId
  sessionTimeoutMinutes?: number
  notifications?: NotificationPreferences
}

export interface GenerateApiKeyResult {
  apiKey: ApiKey
  plaintextSecret: string
  apiKeys: ApiKey[]
}
