import { create } from 'zustand'
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware'

export type ThemeId = 'beige' | 'mono' | 'default' | 'navy' | 'sketch'

const THEME_IDS: readonly ThemeId[] = ['beige', 'mono', 'default', 'navy', 'sketch']

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEME_IDS.includes(value as ThemeId)
}

interface ThemeState {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

const safeStorage: PersistStorage<ThemeState> = {
  getItem: (name) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null
      const str = window.localStorage.getItem(name)
      return str ? (JSON.parse(str) as unknown as StorageValue<ThemeState>) : null
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return
      window.localStorage.setItem(name, JSON.stringify(value))
    } catch {}
  },
  removeItem: (name) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return
      window.localStorage.removeItem(name)
    } catch {}
  },
}

export function getInitialTheme(): ThemeId {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'default'
    const str = window.localStorage.getItem('fci-theme')
    if (str) {
      const parsed: unknown = JSON.parse(str)
      const theme = (parsed as { state?: { theme?: unknown } } | null)?.state?.theme
      if (isThemeId(theme)) {
        return theme
      }
    }
  } catch {}
  return 'default'
}

const initialTheme = getInitialTheme()
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialTheme)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: initialTheme,
      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme)
        }
        set({ theme })
      },
    }),
    {
      name: 'fci-theme',
      storage: safeStorage,
      merge: (persistedState: unknown, currentState: ThemeState): ThemeState => {
        const persisted = persistedState as Partial<ThemeState> | undefined
        if (persisted && isThemeId(persisted.theme)) {
          return { ...currentState, theme: persisted.theme }
        }
        return currentState
      },
      onRehydrateStorage: () => (state) => {
        if (state?.theme && isThemeId(state.theme) && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
      },
    },
  ),
)

