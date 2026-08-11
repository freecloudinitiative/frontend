import { faker } from '@faker-js/faker'
import type { UpdateVmInput } from '@/features/vm/types'

export type VmStatus = 'running' | 'stopped' | 'pending'

export interface Vm {
  id: string
  name: string
  status: VmStatus
  cpu: number      // cores
  memory: number   // GB
  disk: number     // GB
  diskType: 'SSD' | 'HDD'
  ipAddress: string
  os: string
  region: string
  zone: string
  createdAt: string // ISO 8601
}

faker.seed(42)

const OS_OPTIONS = [
  'Ubuntu 24.04 LTS',
  'Ubuntu 22.04 LTS',
  'Debian 12',
  'Debian 11',
  'Rocky Linux 9',
  'AlmaLinux 9',
]

const REGIONS = ['ANK', 'IST'] as const

const ZONE_SUFFIXES = ['1', '2'] as const

function regionToZone(region: string): string {
  return `${region.toLowerCase()}-${faker.helpers.arrayElement(ZONE_SUFFIXES)}`
}

const NAME_PREFIXES = ['prod', 'dev', 'staging', 'infra', 'data', 'edge']
const NAME_SUFFIXES = ['web', 'api', 'db', 'worker', 'cache', 'lb', 'monitor', 'runner']

function generateVm(overrides: Partial<Vm> = {}): Vm {
  const prefix = faker.helpers.arrayElement(NAME_PREFIXES)
  const suffix = faker.helpers.arrayElement(NAME_SUFFIXES)
  const index = faker.number.int({ min: 1, max: 9 })
  const region = faker.helpers.arrayElement(REGIONS)

  return {
    id: faker.string.uuid(),
    name: `${prefix}-${suffix}-${index < 10 ? `0${index}` : index}`,
    status: faker.helpers.weightedArrayElement([
      { value: 'running' as VmStatus, weight: 6 },
      { value: 'stopped' as VmStatus, weight: 2 },
      { value: 'pending' as VmStatus, weight: 1 },
    ]),
    cpu: faker.helpers.arrayElement([1, 2, 4, 8, 16]),
    memory: faker.helpers.arrayElement([1, 2, 4, 8, 16, 32]),
    disk: faker.helpers.arrayElement([20, 50, 100, 200, 500]),
    diskType: faker.helpers.arrayElement(['SSD', 'HDD']),
    ipAddress: faker.internet.ipv4(),
    os: faker.helpers.arrayElement(OS_OPTIONS),
    region,
    zone: regionToZone(region),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    ...overrides,
  }
}

// Mutable in-memory store — create/delete handlers mutate this directly
let vmStore: Vm[] = Array.from({ length: 9 }, () => generateVm())

export function getVms(): Vm[] {
  return vmStore
}

export function getVmById(id: string): Vm | undefined {
  return vmStore.find((vm) => vm.id === id)
}

export function createVm(partial: Partial<Vm>): Vm {
  const vm: Vm = {
    ...generateVm(),
    ...partial,
    id: faker.string.uuid(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    zone: partial.zone ?? regionToZone(partial.region ?? 'ANK'),
  }
  vmStore = [...vmStore, vm]
  return vm
}

export function updateVm(id: string, partial: UpdateVmInput): Vm | undefined {
  let updated: Vm | undefined
  vmStore = vmStore.map((vm) => {
    if (vm.id === id) {
      const { name, status, cpu, memory, disk, os } = partial
      updated = {
        ...vm,
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(cpu !== undefined && { cpu }),
        ...(memory !== undefined && { memory }),
        ...(disk !== undefined && { disk }),
        ...(os !== undefined && { os }),
      }
      return updated
    }
    return vm
  })
  return updated
}

export function deleteVm(id: string): boolean {
  const before = vmStore.length
  vmStore = vmStore.filter((vm) => vm.id !== id)
  return vmStore.length < before
}
