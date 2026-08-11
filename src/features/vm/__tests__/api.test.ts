/**
 * PR #12 & #13 — VM Axios API layer tests
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/test/server'
import { getVms as getMockVms } from '@/mocks/data/vms'
import {
  getVms,
  getVm,
  createVm,
  deleteVm,
  patchVm,
  getVmMetrics,
} from '@/features/vm/api'
import type { Vm, VmMetricPoint } from '@/features/vm/types'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Section 6 – VM Axios API layer (PR #12 & #13)', () => {
  it('6.1 – getVms() returns array of Vm', async () => {
    const vms: Vm[] = await getVms()
    expect(Array.isArray(vms)).toBe(true)
    expect(vms.length).toBeGreaterThanOrEqual(9)
    const vm = vms[0]
    expect(typeof vm.id).toBe('string')
    expect(['running', 'stopped', 'pending']).toContain(vm.status)
    expect(['ANK', 'IST']).toContain(vm.region)
  })

  it('6.2 – getVm(id) returns single Vm', async () => {
    const id = getMockVms()[0].id
    const vm: Vm = await getVm(id)
    expect(vm.id).toBe(id)
    expect(typeof vm.ipAddress).toBe('string')
  })

  it('6.3 – createVm(input) returns new Vm in pending status', async () => {
    const input = {
      name: 'axios-vm-01',
      cpu: 2,
      memory: 4,
      disk: 50,
      os: 'Ubuntu 24.04 LTS',
      region: 'ANK' as const,
    }
    const vm: Vm = await createVm(input)
    expect(typeof vm.id).toBe('string')
    expect(vm.name).toBe(input.name)
    expect(vm.status).toBe('pending')
  })

  it('6.4 – deleteVm(id) resolves for existing VM', async () => {
    const created = await createVm({
      name: 'axios-del-vm',
      cpu: 1,
      memory: 1,
      disk: 20,
      os: 'Debian 12',
      region: 'ANK',
    })
    await expect(deleteVm(created.id)).resolves.toBeUndefined()
  })

  it('6.5 – patchVm(id, partial) updates status to stopped', async () => {
    const id = getMockVms()[0].id
    const updated: Vm = await patchVm(id, { status: 'stopped' })
    expect(updated.id).toBe(id)
    expect(updated.status).toBe('stopped')
  })

  it('6.6 – patchVm(id, partial) updates cpu and memory', async () => {
    const id = getMockVms()[1].id
    const updated: Vm = await patchVm(id, { cpu: 8, memory: 16 })
    expect(updated.id).toBe(id)
    expect(updated.cpu).toBe(8)
    expect(updated.memory).toBe(16)
  })

  it('6.7 – getVmMetrics(id, range) returns metric series for 1h', async () => {
    const id = getMockVms()[0].id
    const metrics: VmMetricPoint[] = await getVmMetrics(id, '1h')
    expect(Array.isArray(metrics)).toBe(true)
    expect(metrics.length).toBe(30)
    expect(typeof metrics[0].cpu).toBe('number')
  })

  it('6.8 – getVmMetrics(id, range) returns 42 points for 1w', async () => {
    const id = getMockVms()[0].id
    const metrics: VmMetricPoint[] = await getVmMetrics(id, '1w')
    expect(metrics.length).toBe(42)
  })

  it('6.9 – getVm() throws AxiosError for unknown ID', async () => {
    await expect(getVm('no-such-vm-axios')).rejects.toThrow()
  })

  it('6.10 – deleteVm() throws AxiosError for unknown ID', async () => {
    await expect(deleteVm('no-such-vm-del-axios')).rejects.toThrow()
  })

  it('6.11 – patchVm() throws when immutable field (region) is sent', async () => {
    const id = getMockVms()[0].id
    // @ts-expect-error testing runtime backend validation
    await expect(patchVm(id, { region: 'IST' })).rejects.toThrow()
  })
})
