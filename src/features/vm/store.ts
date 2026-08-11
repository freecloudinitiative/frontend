import { create } from 'zustand'
import type { Region } from './types'

export interface VmCreateFormState {
  name: string
  region: Region
  cpu: string
  memory: string
  disk: string
  os: string
  provisioningModel: string
  dataProtection: string
  networking: string
}

export const INITIAL_VM_CREATE_FORM: VmCreateFormState = {
  name: '',
  region: 'ANK',
  cpu: '1',
  memory: '1',
  disk: '',
  os: 'Ubuntu 22.04',
  provisioningModel: 'Standard',
  dataProtection: 'Yes',
  networking: 'Default VPC',
}

interface VmState {
  createForm: VmCreateFormState
  setCreateFormField: <K extends keyof VmCreateFormState>(field: K, value: VmCreateFormState[K]) => void
  resetCreateForm: () => void
}

export const useVmStore = create<VmState>()((set) => ({
  createForm: { ...INITIAL_VM_CREATE_FORM },
  setCreateFormField: (field, value) =>
    set((state) => ({
      createForm: {
        ...state.createForm,
        [field]: value,
      },
    })),
  resetCreateForm: () => set({ createForm: { ...INITIAL_VM_CREATE_FORM } }),
}))
