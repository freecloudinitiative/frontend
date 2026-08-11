import { create } from 'zustand'
import type { IamUserRole } from './types'

export interface IamCreateFormState {
  name: string
  email: string
  role: IamUserRole
}

export type IamCreateFormErrors = Partial<Record<keyof IamCreateFormState, string>>

export const INITIAL_IAM_CREATE_FORM: IamCreateFormState = {
  name: '',
  email: '',
  role: 'viewer',
}

interface IamState {
  createForm: IamCreateFormState
  createFormErrors: IamCreateFormErrors
  createFormSuccess: boolean
  actionError: string | null
  setCreateFormField: <K extends keyof IamCreateFormState>(field: K, value: IamCreateFormState[K]) => void
  setCreateFormErrors: (errors: IamCreateFormErrors) => void
  setCreateFormSuccess: (show: boolean) => void
  resetCreateForm: () => void
  setActionError: (error: string | null) => void
}

export const useIamStore = create<IamState>()((set) => ({
  createForm: { ...INITIAL_IAM_CREATE_FORM },
  createFormErrors: {},
  createFormSuccess: false,
  actionError: null,
  setCreateFormField: (field, value) =>
    set((state) => ({
      createForm: {
        ...state.createForm,
        [field]: value,
      },
    })),
  setCreateFormErrors: (errors) => set({ createFormErrors: errors }),
  setCreateFormSuccess: (show) => set({ createFormSuccess: show }),
  resetCreateForm: () =>
    set({
      createForm: { ...INITIAL_IAM_CREATE_FORM },
      createFormErrors: {},
      createFormSuccess: false,
    }),
  setActionError: (actionError) => set({ actionError }),
}))
