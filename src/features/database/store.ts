import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SortingState = { id: string; desc: boolean }[]
export type CopyState = 'copy' | 'copied' | 'failed'

interface DatabaseEditorState {
  scripts: Record<string, string>
  sorting: SortingState
  deleteError: string | null
  copyState: CopyState
  setSqlScript: (databaseId: string, script: string) => void
  getSqlScript: (databaseId: string | null) => string
  setSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void
  setDeleteError: (error: string | null) => void
  setCopyState: (copyState: CopyState) => void
}

export const useDatabaseStore = create<DatabaseEditorState>()(
  persist(
    (set, get) => ({
      scripts: {},
      sorting: [],
      deleteError: null,
      copyState: 'copy',
      setSqlScript: (databaseId, script) => {
        if (!databaseId) return
        set((state) => ({
          scripts: {
            ...state.scripts,
            [databaseId]: script,
          },
        }))
        try {
          localStorage.setItem(`database_${databaseId}_sql`, script)
        } catch {
          // ignore storage errors
        }
      },
      getSqlScript: (databaseId) => {
        if (!databaseId) return ''
        const state = get()
        if (state.scripts[databaseId] !== undefined) {
          return state.scripts[databaseId]
        }
        try {
          const legacyScript = localStorage.getItem(`database_${databaseId}_sql`)
          if (legacyScript !== null) {
            return legacyScript
          }
        } catch {
          // ignore storage errors
        }
        return ''
      },
      setSorting: (updater) =>
        set((state) => ({
          sorting: typeof updater === 'function' ? updater(state.sorting) : updater,
        })),
      setDeleteError: (deleteError) => set({ deleteError }),
      setCopyState: (copyState) => set({ copyState }),
    }),
    {
      name: 'fci-database-editor',
      partialize: (state) => ({ scripts: state.scripts, sorting: state.sorting }),
    },
  ),
)
