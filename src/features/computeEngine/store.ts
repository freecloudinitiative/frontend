import { create } from 'zustand'
import type { Region } from './types'

export interface ComputeEngineCreateFormState {
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

export const INITIAL_COMPUTE_ENGINE_CREATE_FORM: ComputeEngineCreateFormState = {
  name: '',
  region: 'IST',
  cpu: '1',
  memory: '1',
  disk: '',
  os: 'Ubuntu 22.04',
  provisioningModel: 'Standard',
  dataProtection: 'No',
  networking: 'Default VPC',
}

interface ComputeEngineState {
  createForm: ComputeEngineCreateFormState
  setCreateFormField: <K extends keyof ComputeEngineCreateFormState>(
    field: K,
    value: ComputeEngineCreateFormState[K],
  ) => void
  resetCreateForm: () => void
}

export const useComputeEngineStore = create<ComputeEngineState>()((set) => ({
  createForm: { ...INITIAL_COMPUTE_ENGINE_CREATE_FORM },
  setCreateFormField: (field, value) =>
    set((state) => ({
      createForm: {
        ...state.createForm,
        [field]: value,
      },
    })),
  resetCreateForm: () => set({ createForm: { ...INITIAL_COMPUTE_ENGINE_CREATE_FORM } }),
}))
