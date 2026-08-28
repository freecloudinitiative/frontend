import { faker } from '@faker-js/faker'
import type { CreateDatabaseInput, UpdateDatabaseInput, Database, DatabaseEngine, DatabaseStatus, BackupStatus, Region } from '@/features/database/types'

faker.seed(42)

const REGIONS: Region[] = ['IST', 'ANK']

const ZONE_SUFFIXES = ['1', '2'] as const

function regionToZone(region: string): string {
  return `${region.toLowerCase()}-${faker.helpers.arrayElement(ZONE_SUFFIXES)}`
}

const NAME_PREFIXES = ['prod', 'analytics', 'staging', 'cache', 'reporting', 'billing']
const NAME_SUFFIXES = ['db', 'replica', 'primary', 'redis', 'shard', 'read']

const ENGINE_VERSIONS: Record<DatabaseEngine, string[]> = {
  postgres: ['14.10', '15.5', '16.1'],
  mysql: ['5.7', '8.0.35', '8.0.36'],
  redis: ['6.2', '7.0', '7.2'],
  valkey: ['7.2', '8.0'],
  sqlite: ['3.43', '3.44'],
}

const ENGINE_PORTS: Record<DatabaseEngine, number> = {
  postgres: 5432,
  mysql: 3306,
  redis: 6379,
  valkey: 6379,
  sqlite: 0,
}

function buildConnectionString(engine: DatabaseEngine, host: string, port: number, dbName: string): string {
  switch (engine) {
    case 'postgres':
      return `postgresql://app:***@${host}:${port}/${dbName}`
    case 'mysql':
      return `mysql://app:***@${host}:${port}/${dbName}`
    case 'redis':
      return `redis://${host}:${port}`
    case 'valkey':
      return `valkey://${host}:${port}`
    case 'sqlite':
      return `sqlite://${dbName}.db`
  }
}

function generateDatabase(overrides: Partial<Database> = {}): Database {
  const prefix = faker.helpers.arrayElement(NAME_PREFIXES)
  const suffix = faker.helpers.arrayElement(NAME_SUFFIXES)
  const index = faker.number.int({ min: 1, max: 9 })
  const name = `${prefix}-${suffix}-${index < 10 ? `0${index}` : index}`

  const engine = 'postgres' as DatabaseEngine
  const host = faker.internet.ipv4()
  const port = ENGINE_PORTS[engine]
  const maxConnections = faker.helpers.arrayElement([50, 100, 200, 500])
  const dbName = name.replace(/-/g, '_')
  const region = faker.helpers.arrayElement(REGIONS)

  return {
    id: faker.string.uuid(),
    name,
    engine,
    version: faker.helpers.arrayElement(ENGINE_VERSIONS[engine]),
    status: faker.helpers.weightedArrayElement([
      { value: 'running' as DatabaseStatus, weight: 6 },
      { value: 'stopped' as DatabaseStatus, weight: 2 },
      { value: 'pending' as DatabaseStatus, weight: 1 },
    ]),
    cpu: faker.helpers.arrayElement([1, 2, 4, 8]),
    memory: faker.helpers.arrayElement([1, 2, 4]),
    storageSize: faker.helpers.arrayElement([20, 50, 100, 250, 500]),
    connectionString: buildConnectionString(engine, host, port, dbName),
    host,
    port,
    maxConnections,
    activeConnections: faker.number.int({ min: 0, max: maxConnections }),
    backupStatus: faker.helpers.weightedArrayElement([
      { value: 'healthy' as BackupStatus, weight: 6 },
      { value: 'in-progress' as BackupStatus, weight: 2 },
      { value: 'failed' as BackupStatus, weight: 1 },
      { value: 'none' as BackupStatus, weight: 1 },
    ]),
    region,
    zone: regionToZone(region),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    ...overrides,
  }
}

// Mutable in-memory store — create/delete handlers mutate this directly
let databaseStore: Database[] = Array.from({ length: 9 }, () => generateDatabase())

export function resetDatabaseStore(): void {
  faker.seed(42)
  databaseStore = Array.from({ length: 9 }, () => generateDatabase())
}

export function getDatabases(): Database[] {
  return databaseStore
}

export function getDatabaseById(id: string): Database | undefined {
  return databaseStore.find((db) => db.id === id)
}

export function createDatabase(input: Partial<CreateDatabaseInput> = {}): Database {
  const base = generateDatabase()
  const engine = input.engine ?? base.engine
  const host = base.host
  const port = ENGINE_PORTS[engine]
  const dbName = (input.name ?? base.name).replace(/-/g, '_')

  const database: Database = {
    ...base,
    id: faker.string.uuid(),
    name: input.name ?? base.name,
    engine,
    version: input.version ?? ENGINE_VERSIONS[engine][0],
    status: 'pending',
    cpu: input.cpu ?? base.cpu,
    memory: input.memory ?? base.memory,
    storageSize: input.storageSize ?? base.storageSize,
    host,
    port,
    connectionString: buildConnectionString(engine, host, port, dbName),
    region: input.region ?? base.region,
    zone: input.zone ?? regionToZone(input.region ?? base.region),
    createdAt: new Date().toISOString(),
  }
  databaseStore = [...databaseStore, database]
  return database
}

export function updateDatabase(id: string, partial: UpdateDatabaseInput): Database | undefined {
  let updated: Database | undefined
  databaseStore = databaseStore.map((db) => {
    if (db.id === id) {
      const { name, status, cpu, memory, storageSize, backupStatus } = partial
      updated = {
        ...db,
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(cpu !== undefined && { cpu }),
        ...(memory !== undefined && { memory }),
        ...(storageSize !== undefined && { storageSize }),
        ...(backupStatus !== undefined && { backupStatus }),
      }
      return updated
    }
    return db
  })
  return updated
}

export function deleteDatabase(id: string): boolean {
  const before = databaseStore.length
  databaseStore = databaseStore.filter((db) => db.id !== id)
  return databaseStore.length < before
}
