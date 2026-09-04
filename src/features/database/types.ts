export type DatabaseEngine = 'postgres' | 'mysql' | 'redis' | 'valkey' | 'sqlite'
export type DatabaseStatus = 'running' | 'stopped' | 'pending'
export type BackupStatus = 'healthy' | 'failed' | 'in-progress' | 'none'
export type Region = 'ANK' | 'IST'

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
  region: Region
  zone: string
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

export interface Connection {
  clientIp: string
  database: string
  user: string
  state: string
  duration: string
}

export interface CreateDatabaseInput {
  name: string
  engine: DatabaseEngine
  version: string
  storageSize: number
  cpu: number
  memory: number
  region: Region
  zone?: string
}

export interface UpdateDatabaseInput {
  name?: string
  status?: DatabaseStatus
  cpu?: number
  memory?: number
  storageSize?: number
  backupStatus?: BackupStatus
}

export interface SqlExecutionResult {
  success: boolean
  rowsAffected?: number
  resultData?: Record<string, unknown>[]
  errorMessage?: string
  executedAt: string
}

export type ImportMode = 'insert' | 'upsert' | 'replace'

export interface ImportOptions {
  tableName?: string
  delimiter?: string
  hasHeaders?: boolean
  mode: ImportMode
}

export interface ImportResult {
  success: boolean
  rowsImported?: number
  errorMessage?: string
  /**
   * True when the import failed only because the target table does not exist.
   * The one data failure the UI can offer an action for rather than print.
   */
  missingTable?: boolean
  /**
   * A CREATE TABLE statement the service inferred from the uploaded file, for
   * the customer to review and run. CSV uploads only; the service never runs
   * it itself.
   */
  suggestedDdl?: string
}
