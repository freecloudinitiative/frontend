import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type RegionFilter = 'ALL' | 'ANK' | 'IST'

interface RegionState {
  region: RegionFilter
  setRegion: (region: RegionFilter) => void
}

export const useRegionStore = create<RegionState>()(
  persist(
    (set) => ({
      region: 'ALL',
      setRegion: (region) => set({ region }),
    }),
    {
      name: 'fci-region',
      storage: createJSONStorage(() => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage
          }
        } catch {
          // ignore
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
    },
  ),
)
