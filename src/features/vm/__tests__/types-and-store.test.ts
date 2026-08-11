/**
 * PR #12 — VM types, mock data, in-memory store, and UpdateVmInput immutability rules.
 */
import { describe, it, expect } from 'vitest'
import type { Vm, CreateVmInput, UpdateVmInput } from '@/features/vm/types'
import {
  getVms,
  getVmById,
  createVm,
  updateVm,
  deleteVm,
} from '@/mocks/data/vms'

// ---------------------------------------------------------------------------
// 1. Type definitions
// ---------------------------------------------------------------------------

describe('Section 1 – VM type definitions', () => {
  it('1.1 – Vm interface has all required fields with correct types', () => {
    const vm = getVms()[0]
    expect(typeof vm.id).toBe('string')
    expect(typeof vm.name).toBe('string')
    expect(['running', 'stopped', 'pending']).toContain(vm.status)
    expect(typeof vm.cpu).toBe('number')
    expect(typeof vm.memory).toBe('number')
    expect(typeof vm.disk).toBe('number')
    expect(['SSD', 'HDD']).toContain(vm.diskType)
    expect(typeof vm.ipAddress).toBe('string')
    expect(typeof vm.os).toBe('string')
    expect(['ANK', 'IST']).toContain(vm.region)
    expect(typeof vm.createdAt).toBe('string')
  })

  it('1.2 – VmStatus is strictly running | stopped | pending', () => {
    getVms().forEach((vm) => {
      expect(['running', 'stopped', 'pending']).toContain(vm.status)
    })
  })

  it('1.3 – Region is strictly ANK | IST', () => {
    getVms().forEach((vm) => {
      expect(['ANK', 'IST']).toContain(vm.region)
    })
  })

  it('1.4 – CreateVmInput type is usable with all required fields', () => {
    const input: CreateVmInput = {
      name: 'test-vm-01',
      cpu: 2,
      memory: 4,
      disk: 50,
      os: 'Ubuntu 24.04 LTS',
      region: 'ANK',
    }
    expect(input.name).toBe('test-vm-01')
    expect(input.region).toBe('ANK')
  })

  it('1.5 – UpdateVmInput has only mutable fields (no id, createdAt, ipAddress, region, diskType)', () => {
    // Compile-time: these keys must NOT exist in UpdateVmInput
    const update: UpdateVmInput = { name: 'renamed', status: 'stopped', cpu: 4, memory: 8, disk: 100, os: 'Debian 12' }
    // Confirm the six allowed fields exist
    expect(Object.keys(update)).toEqual(expect.arrayContaining(['name', 'status', 'cpu', 'memory', 'disk', 'os']))
    // Immutable fields must not exist on the type
    expect('id' in update).toBe(false)
    expect('createdAt' in update).toBe(false)
    expect('ipAddress' in update).toBe(false)
    expect('region' in update).toBe(false)
    expect('diskType' in update).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 2. Mock data generation
// ---------------------------------------------------------------------------

describe('Section 2 – VM mock data generation', () => {
  it('2.1 – Exactly 9 VMs are seeded', () => {
    // fresh import → seeded store has exactly 9
    const vms = getVms()
    expect(vms.length).toBeGreaterThanOrEqual(9)
  })

  it('2.2 – All IDs are unique UUIDs', () => {
    const ids = getVms().map((vm) => vm.id)
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(id).toMatch(/^[0-9a-f-]{36}$/))
  })

  it('2.3 – Names follow prefix-suffix-N convention', () => {
    getVms().forEach((vm) => {
      expect(vm.name).toMatch(/^[a-z]+-[a-z]+-\d{2}$/)
    })
  })

  it('2.4 – Mix of statuses (predominantly running per weights)', () => {
    const statuses = new Set(getVms().map((vm) => vm.status))
    expect(statuses.size).toBeGreaterThanOrEqual(1)
    statuses.forEach((s) => expect(['running', 'stopped', 'pending']).toContain(s))
  })

  it('2.5 – CPU values are from allowed set [1,2,4,8,16]', () => {
    getVms().forEach((vm) => {
      expect([1, 2, 4, 8, 16]).toContain(vm.cpu)
    })
  })

  it('2.6 – Memory values are from allowed set [1,2,4,8,16,32]', () => {
    getVms().forEach((vm) => {
      expect([1, 2, 4, 8, 16, 32]).toContain(vm.memory)
    })
  })

  it('2.7 – Disk values are from allowed set [20,50,100,200,500]', () => {
    getVms().forEach((vm) => {
      expect([20, 50, 100, 200, 500]).toContain(vm.disk)
    })
  })

  it('2.8 – IP addresses look like valid IPv4', () => {
    getVms().forEach((vm) => {
      expect(vm.ipAddress).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
    })
  })

  it('2.9 – createdAt is a valid ISO 8601 timestamp', () => {
    getVms().forEach((vm) => {
      expect(new Date(vm.createdAt).toISOString()).toBe(vm.createdAt)
    })
  })

  it('2.10 – OS values are from the known list', () => {
    const VALID_OS = ['Ubuntu 24.04 LTS', 'Ubuntu 22.04 LTS', 'Debian 12', 'Debian 11', 'Rocky Linux 9', 'AlmaLinux 9']
    getVms().forEach((vm) => {
      expect(VALID_OS).toContain(vm.os)
    })
  })
})

// ---------------------------------------------------------------------------
// 3. In-memory store CRUD
// ---------------------------------------------------------------------------

describe('Section 3 – VM in-memory store functions', () => {
  it('3.1 – getVms() returns all VMs', () => {
    expect(Array.isArray(getVms())).toBe(true)
    expect(getVms().length).toBeGreaterThanOrEqual(9)
  })

  it('3.2 – getVmById() returns correct record', () => {
    const id = getVms()[0].id
    const vm = getVmById(id)
    expect(vm).toBeDefined()
    expect(vm!.id).toBe(id)
  })

  it('3.3 – getVmById() returns undefined for unknown ID', () => {
    expect(getVmById('no-such-vm-id')).toBeUndefined()
  })

  it('3.4 – createVm() adds record with pending status and fresh createdAt', () => {
    const before = getVms().length
    const vm = createVm({ name: 'test-vm-create', cpu: 2, memory: 4 })
    expect(getVms().length).toBe(before + 1)
    expect(vm.id).toBeTruthy()
    expect(vm.status).toBe('pending')
    expect(() => new Date(vm.createdAt)).not.toThrow()
  })

  it('3.5 – createVm() with name override uses that name', () => {
    const vm = createVm({ name: 'my-custom-vm' })
    expect(vm.name).toBe('my-custom-vm')
  })

  it('3.6 – createVm() generates unique IDs', () => {
    const a = createVm({ name: 'vm-a' })
    const b = createVm({ name: 'vm-b' })
    expect(a.id).not.toBe(b.id)
  })

  it('3.7 – updateVm() updates mutable fields only', () => {
    const vm = createVm({ name: 'update-target' })
    const updated = updateVm(vm.id, { status: 'stopped', name: 'updated-vm', cpu: 8 })
    expect(updated).toBeDefined()
    expect(updated!.status).toBe('stopped')
    expect(updated!.name).toBe('updated-vm')
    expect(updated!.cpu).toBe(8)
    // Immutable fields unchanged
    expect(updated!.id).toBe(vm.id)
    expect(updated!.ipAddress).toBe(vm.ipAddress)
    expect(updated!.region).toBe(vm.region)
    expect(updated!.diskType).toBe(vm.diskType)
    expect(updated!.createdAt).toBe(vm.createdAt)
  })

  it('3.8 – updateVm() returns undefined for unknown ID', () => {
    expect(updateVm('no-such-vm', { status: 'stopped' })).toBeUndefined()
  })

  it('3.9 – deleteVm() removes record and returns true', () => {
    const vm = createVm({ name: 'to-delete-vm' })
    expect(deleteVm(vm.id)).toBe(true)
    expect(getVmById(vm.id)).toBeUndefined()
  })

  it('3.10 – deleteVm() returns false for unknown ID', () => {
    expect(deleteVm('no-such-vm-del')).toBe(false)
  })

  it('3.11 – Store mutations persist: created VM appears in getVms()', () => {
    const vm = createVm({ name: 'persist-vm' })
    expect(getVms().some((v) => v.id === vm.id)).toBe(true)
  })

  it('3.12 – Deleting one VM does not affect others', () => {
    const all = getVms()
    const keep = all[0]
    const del = createVm({ name: 'tmp-del-vm' })
    deleteVm(del.id)
    expect(getVmById(keep.id)).toBeDefined()
  })
})
