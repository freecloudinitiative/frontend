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

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'default',
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
