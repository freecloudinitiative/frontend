import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'

export type ThemeId = 'beige' | 'mono' | 'default' | 'navy' | 'sketch'

interface ThemeState {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

const safeStorage: PersistStorage<ThemeState> = {
  getItem: (name) => {
    if (typeof window === 'undefined' || !window.localStorage) return null
    try {
      const str = window.localStorage.getItem(name)
      return str ? JSON.parse(str) : null
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      window.localStorage.setItem(name, JSON.stringify(value))
    } catch {}
  },
  removeItem: (name) => {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      window.localStorage.removeItem(name)
    } catch {}
  },
}

export function getInitialTheme(): ThemeId {
  if (typeof window === 'undefined' || !window.localStorage) return 'default'
  try {
    const str = window.localStorage.getItem('fci-theme')
    if (str) {
      const parsed = JSON.parse(str)
      const theme = parsed?.state?.theme
      if (theme && ['beige', 'mono', 'default', 'navy', 'sketch'].includes(theme)) {
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
      onRehydrateStorage: () => (state) => {
        if (state?.theme && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
      },
    },
  ),
)
