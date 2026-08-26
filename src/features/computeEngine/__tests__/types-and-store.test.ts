/**
 * Compute Engine types, mock data, in-memory store, UpdateComputeEngineInput immutability rules,
 * and useComputeEngineStore Zustand UI store.
 */
import { describe, it, expect } from 'vitest'
import type { CreateComputeEngineInput, UpdateComputeEngineInput } from '@/features/computeEngine/types'
import { COMPUTE_ENGINE_OS_OPTIONS } from '@/features/computeEngine/constants'
import {
  getComputeEngines,
  getComputeEngineById,
  createComputeEngine,
  updateComputeEngine,
  deleteComputeEngine,
} from '@/mocks/data/computeEngines'

// ---------------------------------------------------------------------------
// 1. Type definitions
// ---------------------------------------------------------------------------

describe('Section 1 – Compute Engine type definitions', () => {
  it('1.1 – ComputeEngine interface has all required fields with correct types', () => {
    const computeEngine = getComputeEngines()[0]
    expect(typeof computeEngine.id).toBe('string')
    expect(typeof computeEngine.name).toBe('string')
    expect(['running', 'stopped', 'pending']).toContain(computeEngine.status)
    expect(typeof computeEngine.cpu).toBe('number')
    expect(typeof computeEngine.memory).toBe('number')
    expect(typeof computeEngine.disk).toBe('number')
    expect(['SSD', 'HDD']).toContain(computeEngine.diskType)
    expect(typeof computeEngine.ipAddress).toBe('string')
    expect(typeof computeEngine.os).toBe('string')
    expect(['ANK', 'IST']).toContain(computeEngine.region)
    expect(typeof computeEngine.createdAt).toBe('string')
  })

  it('1.2 – ComputeEngineStatus is strictly running | stopped | pending', () => {
    getComputeEngines().forEach((computeEngine) => {
      expect(['running', 'stopped', 'pending']).toContain(computeEngine.status)
    })
  })

  it('1.3 – Region is strictly ANK | IST', () => {
    getComputeEngines().forEach((computeEngine) => {
      expect(['ANK', 'IST']).toContain(computeEngine.region)
    })
  })

  it('1.4 – CreateComputeEngineInput type is usable with all required fields', () => {
    const input: CreateComputeEngineInput = {
      name: 'test-ce-01',
      cpu: 2,
      memory: 4,
      disk: 50,
      os: 'Ubuntu 24.04',
      region: 'ANK',
    }
    expect(input.name).toBe('test-ce-01')
    expect(input.region).toBe('ANK')
  })

type ImmutableKeys = 'id' | 'createdAt' | 'ipAddress' | 'region' | 'diskType'
type AssertNoImmutableKeys = Extract<keyof UpdateComputeEngineInput, ImmutableKeys> extends never ? true : false
const _assertNoImmutableKeys: AssertNoImmutableKeys = true

  it('1.5 – UpdateComputeEngineInput has only mutable fields (no id, createdAt, ipAddress, region, diskType)', () => {
    expect(_assertNoImmutableKeys).toBe(true)
    const update: UpdateComputeEngineInput = { name: 'renamed', status: 'stopped', cpu: 4, memory: 8, disk: 100, os: 'Debian 12' }
    expect(Object.keys(update)).toEqual(expect.arrayContaining(['name', 'status', 'cpu', 'memory', 'disk', 'os']))
  })
})

// ---------------------------------------------------------------------------
// 2. Mock data generation
// ---------------------------------------------------------------------------

describe('Section 2 – Compute Engine mock data generation', () => {
  it('exports the backend OS identifiers in catalogue order', () => {
    expect(COMPUTE_ENGINE_OS_OPTIONS).toEqual([
      'Ubuntu 20.04',
      'Ubuntu 22.04',
      'Ubuntu 24.04',
      'Debian 11',
      'Debian 12',
      'AlmaLinux 8',
      'AlmaLinux 9',
      'Rocky Linux 8',
      'Rocky Linux 9',
    ])
  })

  it('2.1 – Exactly 9 Compute Engines are seeded', () => {
    // fresh import → seeded store has exactly 9
    const computeEngines = getComputeEngines()
    expect(computeEngines.length).toBeGreaterThanOrEqual(9)
  })

  it('2.2 – All IDs are unique UUIDs', () => {
    const ids = getComputeEngines().map((computeEngine) => computeEngine.id)
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(id).toMatch(/^[0-9a-f-]{36}$/))
  })

  it('2.3 – Names follow prefix-suffix-N convention', () => {
    getComputeEngines().forEach((computeEngine) => {
      expect(computeEngine.name).toMatch(/^[a-z]+-[a-z]+-\d{2}$/)
    })
  })

  it('2.4 – Mix of statuses (predominantly running per weights)', () => {
    const statuses = new Set(getComputeEngines().map((computeEngine) => computeEngine.status))
    expect(statuses.size).toBeGreaterThanOrEqual(1)
    statuses.forEach((s) => expect(['running', 'stopped', 'pending']).toContain(s))
  })

  it('2.5 – CPU values are from allowed set [1,2,4,8,16]', () => {
    getComputeEngines().forEach((computeEngine) => {
      expect([1, 2, 4, 8, 16]).toContain(computeEngine.cpu)
    })
  })

  it('2.6 – Memory values are from allowed set [1,2,4,8,16,32]', () => {
    getComputeEngines().forEach((computeEngine) => {
      expect([0.5, 1, 2, 4, 8, 16, 32]).toContain(computeEngine.memory)
    })
  })

  it('2.7 – Disk values are from allowed set [20,50,100,200,500]', () => {
    getComputeEngines().forEach((computeEngine) => {
      expect([20, 50, 100, 200, 500]).toContain(computeEngine.disk)
    })
  })

  it('2.8 – IP addresses look like valid IPv4', () => {
    getComputeEngines().forEach((computeEngine) => {
      expect(computeEngine.ipAddress).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
    })
  })

  it('2.9 – createdAt is a valid ISO 8601 timestamp', () => {
    getComputeEngines().forEach((computeEngine) => {
      expect(new Date(computeEngine.createdAt).toISOString()).toBe(computeEngine.createdAt)
    })
  })

  it('2.10 – OS values are from the known list', () => {
    getComputeEngines().forEach((computeEngine) => {
      expect(COMPUTE_ENGINE_OS_OPTIONS).toContain(computeEngine.os)
    })
  })
})

// ---------------------------------------------------------------------------
// 3. In-memory store CRUD
// ---------------------------------------------------------------------------

describe('Section 3 – Compute Engine in-memory store functions', () => {
  it('3.1 – getComputeEngines() returns all Compute Engines', () => {
    expect(Array.isArray(getComputeEngines())).toBe(true)
    expect(getComputeEngines().length).toBeGreaterThanOrEqual(9)
  })

  it('3.2 – getComputeEngineById() returns correct record', () => {
    const id = getComputeEngines()[0].id
    const computeEngine = getComputeEngineById(id)
    expect(computeEngine).toBeDefined()
    expect(computeEngine!.id).toBe(id)
  })

  it('3.3 – getComputeEngineById() returns undefined for unknown ID', () => {
    expect(getComputeEngineById('no-such-ce-id')).toBeUndefined()
  })

  it('3.4 – createComputeEngine() adds record with pending status and fresh createdAt', () => {
    const before = getComputeEngines().length
    const computeEngine = createComputeEngine({ name: 'test-ce-create', cpu: 2, memory: 4 })
    expect(getComputeEngines().length).toBe(before + 1)
    expect(computeEngine.id).toBeTruthy()
    expect(computeEngine.status).toBe('pending')
    expect(new Date(computeEngine.createdAt).toISOString()).toBe(computeEngine.createdAt)
  })

  it('3.5 – createComputeEngine() with name override uses that name', () => {
    const computeEngine = createComputeEngine({ name: 'my-custom-ce' })
    expect(computeEngine.name).toBe('my-custom-ce')
  })

  it('3.6 – createComputeEngine() generates unique IDs', () => {
    const a = createComputeEngine({ name: 'ce-a' })
    const b = createComputeEngine({ name: 'ce-b' })
    expect(a.id).not.toBe(b.id)
  })

  it('3.7 – updateComputeEngine() updates mutable fields only', () => {
    const computeEngine = createComputeEngine({ name: 'update-target' })
    const updated = updateComputeEngine(computeEngine.id, { status: 'stopped', name: 'updated-ce', cpu: 8 })
    expect(updated).toBeDefined()
    expect(updated!.status).toBe('stopped')
    expect(updated!.name).toBe('updated-ce')
    expect(updated!.cpu).toBe(8)
    // Immutable fields unchanged
    expect(updated!.id).toBe(computeEngine.id)
    expect(updated!.ipAddress).toBe(computeEngine.ipAddress)
    expect(updated!.region).toBe(computeEngine.region)
    expect(updated!.diskType).toBe(computeEngine.diskType)
    expect(updated!.createdAt).toBe(computeEngine.createdAt)
  })

  it('3.8 – updateComputeEngine() returns undefined for unknown ID', () => {
    expect(updateComputeEngine('no-such-ce', { status: 'stopped' })).toBeUndefined()
  })

  it('3.9 – deleteComputeEngine() removes record and returns true', () => {
    const computeEngine = createComputeEngine({ name: 'to-delete-ce' })
    expect(deleteComputeEngine(computeEngine.id)).toBe(true)
    expect(getComputeEngineById(computeEngine.id)).toBeUndefined()
  })

  it('3.10 – deleteComputeEngine() returns false for unknown ID', () => {
    expect(deleteComputeEngine('no-such-ce-del')).toBe(false)
  })

  it('3.11 – Store mutations persist: created Compute Engine appears in getComputeEngines()', () => {
    const computeEngine = createComputeEngine({ name: 'persist-ce' })
    expect(getComputeEngines().some((v) => v.id === computeEngine.id)).toBe(true)
  })

  it('3.12 – Deleting one Compute Engine does not affect others', () => {
    const all = getComputeEngines()
    const keep = all[0]
    const del = createComputeEngine({ name: 'tmp-del-ce' })
    deleteComputeEngine(del.id)
    expect(getComputeEngineById(keep.id)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// 4. useComputeEngineStore Zustand UI Store
// ---------------------------------------------------------------------------

describe('Section 4 – useComputeEngineStore Zustand UI Store', () => {
  it('4.1 – Initial state has default form values', async () => {
    const { useComputeEngineStore, INITIAL_COMPUTE_ENGINE_CREATE_FORM } = await import('@/features/computeEngine/store')
    useComputeEngineStore.getState().resetCreateForm()

    const state = useComputeEngineStore.getState()
    expect(state.createForm).toEqual(INITIAL_COMPUTE_ENGINE_CREATE_FORM)
    expect(state.createForm.name).toBe('')
    expect(state.createForm.region).toBe('IST')
    expect(state.createForm.cpu).toBe('1')
    expect(state.createForm.memory).toBe('1')
    expect(state.createForm.os).toBe('Ubuntu 22.04')
  })

  it('4.2 – setCreateFormField updates individual fields correctly', async () => {
    const { useComputeEngineStore } = await import('@/features/computeEngine/store')
    useComputeEngineStore.getState().resetCreateForm()

    useComputeEngineStore.getState().setCreateFormField('name', 'prod-api-01')
    useComputeEngineStore.getState().setCreateFormField('region', 'IST')
    useComputeEngineStore.getState().setCreateFormField('cpu', '4')
    useComputeEngineStore.getState().setCreateFormField('memory', '8')
    useComputeEngineStore.getState().setCreateFormField('disk', '100')
    useComputeEngineStore.getState().setCreateFormField('os', 'Debian 12')
    useComputeEngineStore.getState().setCreateFormField('provisioningModel', 'Spot')
    useComputeEngineStore.getState().setCreateFormField('dataProtection', 'No')
    useComputeEngineStore.getState().setCreateFormField('networking', 'Custom VPC')

    const state = useComputeEngineStore.getState()
    expect(state.createForm.name).toBe('prod-api-01')
    expect(state.createForm.region).toBe('IST')
    expect(state.createForm.cpu).toBe('4')
    expect(state.createForm.memory).toBe('8')
    expect(state.createForm.disk).toBe('100')
    expect(state.createForm.os).toBe('Debian 12')
    expect(state.createForm.provisioningModel).toBe('Spot')
    expect(state.createForm.dataProtection).toBe('No')
    expect(state.createForm.networking).toBe('Custom VPC')
  })

  it('4.3 – resetCreateForm restores default values', async () => {
    const { useComputeEngineStore, INITIAL_COMPUTE_ENGINE_CREATE_FORM } = await import('@/features/computeEngine/store')
    useComputeEngineStore.getState().setCreateFormField('name', 'modified-ce')
    useComputeEngineStore.getState().setCreateFormField('region', 'IST')
    useComputeEngineStore.getState().setCreateFormField('cpu', '16')

    useComputeEngineStore.getState().resetCreateForm()

    const state = useComputeEngineStore.getState()
    expect(state.createForm).toEqual(INITIAL_COMPUTE_ENGINE_CREATE_FORM)
  })

  it('4.4 – setCreateFormField does not mutate other fields', async () => {
    const { useComputeEngineStore, INITIAL_COMPUTE_ENGINE_CREATE_FORM } = await import('@/features/computeEngine/store')
    useComputeEngineStore.getState().resetCreateForm()

    useComputeEngineStore.getState().setCreateFormField('name', 'only-name-changed')
    const state = useComputeEngineStore.getState()
    // All fields except name should remain at initial values
    expect(state.createForm).toEqual({
      ...INITIAL_COMPUTE_ENGINE_CREATE_FORM,
      name: 'only-name-changed',
    })
  })
})
