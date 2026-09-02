export type ComputeEngineStatus = 'running' | 'stopped' | 'pending'
export type Region = 'ANK' | 'IST'

export interface ComputeEngine {
  id: string
  name: string
  status: ComputeEngineStatus
  /** Reason a pending engine is not progressing. Absent when healthy. */
  message?: string
  cpu: number
  memory: number
  disk: number
  diskType: 'SSD' | 'HDD'
  /**
   * Null until the reconciler observes a running pod. The API always includes
   * this field because its Go type is *string without omitempty.
   */
  ipAddress: string | null
  os: string
  region: Region
  zone: string
  instanceType: string
  autoBackups: boolean
  createdAt: string
}

export interface ComputeEngineMetricPoint {
  timestamp: string
  cpu: number
  memory: number
  disk: number
}

export type ComputeEngineBackupStatus = 'pending' | 'running' | 'completed' | 'failed' | 'expired'

export interface ComputeEngineBackup {
  id: string
  computeEngineId: string
  status: ComputeEngineBackupStatus
  sizeBytes?: number
  startedAt: string
  completedAt?: string
  expiresAt?: string
  errorMessage?: string
}

export type MetricRange = '30m' | '1h' | '3h' | '1w'

export interface CreateComputeEngineInput {
  name: string
  cpu: number
  memory: number
  disk: number
  os: string
  region: Region
  zone?: string
}

export interface UpdateComputeEngineInput {
  name?: string
  status?: ComputeEngineStatus
  cpu?: number
  memory?: number
  disk?: number
  os?: string
  autoBackups?: boolean
}
