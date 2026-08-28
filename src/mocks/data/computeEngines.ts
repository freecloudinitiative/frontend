import { faker } from '@faker-js/faker'
import { COMPUTE_ENGINE_OS_OPTIONS } from '@/features/computeEngine/constants'
import type { UpdateComputeEngineInput } from '@/features/computeEngine/types'

export type ComputeEngineStatus = 'running' | 'stopped' | 'pending'

export interface ComputeEngine {
  id: string
  name: string
  status: ComputeEngineStatus
  message?: string
  cpu: number      // cores
  memory: number   // GB
  disk: number     // GB
  diskType: 'SSD' | 'HDD'
  ipAddress: string
  os: string
  autoBackups: boolean
  region: string
  zone: string
  createdAt: string // ISO 8601
}

faker.seed(42)

const REGIONS = ['IST'] as const

const ZONE_SUFFIXES = ['1', '2'] as const

function regionToZone(region: string): string {
  return `${region.toLowerCase()}-${faker.helpers.arrayElement(ZONE_SUFFIXES)}`
}

const NAME_PREFIXES = ['prod', 'dev', 'staging', 'infra', 'data', 'edge']
const NAME_SUFFIXES = ['web', 'api', 'db', 'worker', 'cache', 'lb', 'monitor', 'runner']

function generateComputeEngine(overrides: Partial<ComputeEngine> = {}): ComputeEngine {
  const prefix = faker.helpers.arrayElement(NAME_PREFIXES)
  const suffix = faker.helpers.arrayElement(NAME_SUFFIXES)
  const index = faker.number.int({ min: 1, max: 9 })
  const region = faker.helpers.arrayElement(REGIONS)

  return {
    id: faker.string.uuid(),
    name: `${prefix}-${suffix}-${index < 10 ? `0${index}` : index}`,
    status: faker.helpers.weightedArrayElement([
      { value: 'running' as ComputeEngineStatus, weight: 6 },
      { value: 'stopped' as ComputeEngineStatus, weight: 2 },
      { value: 'pending' as ComputeEngineStatus, weight: 1 },
    ]),
    cpu: faker.helpers.arrayElement([1, 2, 4, 8, 16]),
    memory: faker.helpers.arrayElement([1, 2, 4]),
    disk: faker.helpers.arrayElement([20, 50, 100, 200, 500]),
    diskType: faker.helpers.arrayElement(['SSD', 'HDD']),
    ipAddress: faker.internet.ipv4(),
    os: faker.helpers.arrayElement(COMPUTE_ENGINE_OS_OPTIONS),
    autoBackups: false,
    region,
    zone: regionToZone(region),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    ...overrides,
  }
}

function generateComputeEngineFixtures(): ComputeEngine[] {
  return [
    generateComputeEngine({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'staging-worker-01',
      status: 'pending',
      message: 'Failed to pull image: ImagePullBackOff',
    }),
    generateComputeEngine({
      id: '00000000-0000-4000-8000-000000000002',
      name: 'dev-worker-02',
      status: 'pending',
    }),
    ...Array.from({ length: 7 }, () => generateComputeEngine()),
  ]
}

// Mutable in-memory store — create/delete handlers mutate this directly
let computeEngineStore: ComputeEngine[] = generateComputeEngineFixtures()

export function resetComputeEngineStore(): void {
  faker.seed(42)
  computeEngineStore = generateComputeEngineFixtures()
}

export function getComputeEngines(): ComputeEngine[] {
  return computeEngineStore
}

export function getComputeEngineById(id: string): ComputeEngine | undefined {
  return computeEngineStore.find((computeEngine) => computeEngine.id === id)
}

export function createComputeEngine(partial: Partial<ComputeEngine>): ComputeEngine {
  const computeEngine: ComputeEngine = {
    ...generateComputeEngine(),
    ...partial,
    id: faker.string.uuid(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    zone: partial.zone ?? regionToZone(partial.region ?? 'ANK'),
  }
  computeEngineStore = [...computeEngineStore, computeEngine]
  return computeEngine
}

export function updateComputeEngine(id: string, partial: UpdateComputeEngineInput): ComputeEngine | undefined {
  let updated: ComputeEngine | undefined
  computeEngineStore = computeEngineStore.map((computeEngine) => {
    if (computeEngine.id === id) {
      const { name, status, cpu, memory, disk, os, autoBackups } = partial
      updated = {
        ...computeEngine,
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(cpu !== undefined && { cpu }),
        ...(memory !== undefined && { memory }),
        ...(disk !== undefined && { disk }),
        ...(os !== undefined && { os }),
        ...(autoBackups !== undefined && { autoBackups }),
      }
      return updated
    }
    return computeEngine
  })
  return updated
}

export function deleteComputeEngine(id: string): boolean {
  const before = computeEngineStore.length
  computeEngineStore = computeEngineStore.filter((computeEngine) => computeEngine.id !== id)
  return computeEngineStore.length < before
}
