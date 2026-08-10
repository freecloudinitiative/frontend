export type VmStatus = 'running' | 'stopped' | 'pending'

export interface Vm {
  id: string
  name: string
  status: VmStatus
  cpu: number
  memory: number
  disk: number
  diskType: 'SSD' | 'HDD'
  ipAddress: string
  os: string
  region: string
  createdAt: string
}

export interface VmMetricPoint {
  timestamp: string
  cpu: number
  memory: number
  disk: number
}

export interface CreateVmInput {
  name: string
  cpu: number
  memory: number
  disk: number
  os: string
}
