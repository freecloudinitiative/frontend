import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'beige' | 'mono' | 'default' | 'navy'

interface ThemeState {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
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
      onRehydrateStorage: () => (state) => {
        if (state?.theme && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
      },
    },
  ),
)
