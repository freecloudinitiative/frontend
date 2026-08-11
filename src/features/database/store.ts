import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DatabaseEngine, Region } from './types'

export type SortingState = { id: string; desc: boolean }[]
export type CopyState = 'copy' | 'copied' | 'failed'

export interface DatabaseCreateFormState {
  name: string
  region: Region
  engine: DatabaseEngine
  version: string
  cpu: string
  memory: string
  storageSize: string
}

export const INITIAL_DATABASE_CREATE_FORM: DatabaseCreateFormState = {
  name: '',
  region: 'ANK',
  engine: 'postgres',
  version: '14.10',
  cpu: '1',
  memory: '1',
  storageSize: '',
}

interface DatabaseEditorState {
  scripts: Record<string, string>
  sorting: SortingState
  deleteError: string | null
  copyState: CopyState
  createForm: DatabaseCreateFormState
  setSqlScript: (databaseId: string, script: string) => void
  getSqlScript: (databaseId: string | null) => string
  setSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void
  setDeleteError: (error: string | null) => void
  setCopyState: (copyState: CopyState) => void
  setCreateFormField: <K extends keyof DatabaseCreateFormState>(field: K, value: DatabaseCreateFormState[K]) => void
  updateCreateEngine: (engine: DatabaseEngine, version: string) => void
  resetCreateForm: () => void
}

export const useDatabaseStore = create<DatabaseEditorState>()(
  persist(
    (set, get) => ({
      scripts: {},
      sorting: [],
      deleteError: null,
      copyState: 'copy',
      createForm: { ...INITIAL_DATABASE_CREATE_FORM },
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
      setCreateFormField: (field, value) =>
        set((state) => ({
          createForm: {
            ...state.createForm,
            [field]: value,
          },
        })),
      updateCreateEngine: (engine, version) =>
        set((state) => ({
          createForm: {
            ...state.createForm,
            engine,
            version,
          },
        })),
      resetCreateForm: () => set({ createForm: { ...INITIAL_DATABASE_CREATE_FORM } }),
    }),
    {
      name: 'fci-database-editor',
      partialize: (state) => ({ scripts: state.scripts, sorting: state.sorting }),
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
