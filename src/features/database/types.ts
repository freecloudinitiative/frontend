export type DatabaseEngine = 'postgres' | 'mysql' | 'redis'
export type DatabaseStatus = 'running' | 'stopped' | 'pending'
export type BackupStatus = 'healthy' | 'failed' | 'in-progress' | 'none'

export interface Database {
  id: string
  name: string
  engine: DatabaseEngine
  version: string
  status: DatabaseStatus
  cpu: number
  memory: number
  storageSize: number
  connectionString: string
  host: string
  port: number
  maxConnections: number
  activeConnections: number
  backupStatus: BackupStatus
  region: string
  createdAt: string
}

export interface DatabaseMetricPoint {
  timestamp: string
  connections: number
  queriesPerSecond: number
  diskIO: number
  cpuUsage: number
  memoryUsage: number
}

export interface CreateDatabaseInput {
  name: string
  engine: DatabaseEngine
  version: string
  storageSize: number
  cpu: number
  memory: number
}

export interface UpdateDatabaseInput {
  name?: string
  status?: DatabaseStatus
  cpu?: number
  memory?: number
  storageSize?: number
  backupStatus?: BackupStatus
}
