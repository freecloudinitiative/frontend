export type VmStatus = 'running' | 'stopped' | 'pending'
export type Region = 'ANK' | 'IST'

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
  region: Region
  createdAt: string
}

export interface VmMetricPoint {
  timestamp: string
  cpu: number
  memory: number
  disk: number
}

export type MetricRange = '30m' | '1h' | '3h' | '1w'

export interface CreateVmInput {
  name: string
  cpu: number
  memory: number
  disk: number
  os: string
  region: Region
}

export interface UpdateVmInput {
  name?: string
  status?: VmStatus
  cpu?: number
  memory?: number
  disk?: number
  os?: string
}
