import { create } from 'zustand'

interface SidebarState {
  openSectionIds: Set<string>
  isOpen: (id: string) => boolean
  open: (id: string) => void
  close: (id: string) => void
  toggle: (id: string) => void
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  openSectionIds: new Set(),

  isOpen: (id) => get().openSectionIds.has(id),

  open: (id) => set({ openSectionIds: new Set([id]) }),

  close: (id) =>
    set((state) => {
      const next = new Set(state.openSectionIds)
      next.delete(id)
      return { openSectionIds: next }
    }),

  toggle: (id) =>
    set((state) => {
      const currentlyOpen = state.openSectionIds.has(id)
      return { openSectionIds: currentlyOpen ? new Set() : new Set([id]) }
    }),
}))
