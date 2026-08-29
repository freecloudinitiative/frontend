/**
 * Compute Engine Axios API layer tests
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { getComputeEngines as getMockComputeEngines } from '@/mocks/data/computeEngines'
import {
  getComputeEngines,
  getComputeEngine,
  createComputeEngine,
  deleteComputeEngine,
  patchComputeEngine,
  getComputeEngineMetrics,
} from '@/features/computeEngine/api'
import type { ComputeEngine, ComputeEngineMetricPoint } from '@/features/computeEngine/types'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Section 6 – Compute Engine Axios API layer', () => {
  it('6.1 – getComputeEngines() returns array of ComputeEngine', async () => {
    const computeEngines: ComputeEngine[] = await getComputeEngines()
    expect(Array.isArray(computeEngines)).toBe(true)
    expect(computeEngines.length).toBeGreaterThanOrEqual(9)
    const computeEngine = computeEngines[0]
    expect(typeof computeEngine.id).toBe('string')
    expect(['running', 'stopped', 'pending']).toContain(computeEngine.status)
    expect(['ANK', 'IST']).toContain(computeEngine.region)
  })

  it('6.2 – getComputeEngine(id) returns single ComputeEngine', async () => {
    const id = getMockComputeEngines()[0].id
    const computeEngine: ComputeEngine = await getComputeEngine(id)
    expect(computeEngine.id).toBe(id)
    expect(computeEngine.ipAddress).toBeNull()
  })

  it('6.3 – createComputeEngine(input) returns new ComputeEngine in pending status', async () => {
    const input = {
      name: 'axios-ce-01',
      cpu: 2,
      memory: 4096,
      disk: 50,
      os: 'Ubuntu 24.04',
      region: 'ANK' as const,
    }
    const computeEngine: ComputeEngine = await createComputeEngine(input)
    expect(typeof computeEngine.id).toBe('string')
    expect(computeEngine.name).toBe(input.name)
    expect(computeEngine.status).toBe('pending')
    expect(computeEngine.ipAddress).toBeNull()
  })

  it('6.4 – deleteComputeEngine(id) resolves for existing Compute Engine', async () => {
    const created = await createComputeEngine({
      name: 'axios-del-ce',
      cpu: 1,
      memory: 1024,
      disk: 20,
      os: 'Debian 12',
      region: 'ANK',
    })
    await expect(deleteComputeEngine(created.id)).resolves.toBeUndefined()
  })

  it('6.5 – patchComputeEngine(id, partial) updates status to stopped', async () => {
    const id = getMockComputeEngines()[0].id
    const updated: ComputeEngine = await patchComputeEngine(id, { status: 'stopped' })
    expect(updated.id).toBe(id)
    expect(updated.status).toBe('stopped')
  })

  it('6.6 – patchComputeEngine(id, partial) updates cpu and memory', async () => {
    const id = getMockComputeEngines()[1].id
    const updated: ComputeEngine = await patchComputeEngine(id, { cpu: 8, memory: 16384 })
    expect(updated.id).toBe(id)
    expect(updated.cpu).toBe(8)
    expect(updated.memory).toBe(16384)
  })

  it('6.7 – getComputeEngineMetrics(id, range) returns metric series for 1h', async () => {
    const id = getMockComputeEngines()[0].id
    const metrics: ComputeEngineMetricPoint[] = await getComputeEngineMetrics(id, '1h')
    expect(Array.isArray(metrics)).toBe(true)
    expect(metrics.length).toBe(30)
    expect(typeof metrics[0].cpu).toBe('number')
  })

  it('6.8 – getComputeEngineMetrics(id, range) returns 42 points for 1w', async () => {
    const id = getMockComputeEngines()[0].id
    const metrics: ComputeEngineMetricPoint[] = await getComputeEngineMetrics(id, '1w')
    expect(metrics.length).toBe(42)
  })

  it('6.8a – getComputeEngineMetrics unwraps an object response containing metrics', async () => {
    const id = getMockComputeEngines()[0].id
    const point: ComputeEngineMetricPoint = {
      timestamp: '2026-08-22T12:00:00.000Z',
      cpu: 25,
      memory: 50,
      disk: 75,
    }
    server.use(
      http.get('*/api/compute-engines/:id/metrics', () =>
        HttpResponse.json({ metrics: [point] }),
      ),
    )

    await expect(getComputeEngineMetrics(id, '1h')).resolves.toEqual([point])
  })

  it('6.8b – getComputeEngineMetrics unwraps an object response containing data', async () => {
    const id = getMockComputeEngines()[0].id
    const point: ComputeEngineMetricPoint = {
      timestamp: '2026-08-22T12:00:00.000Z',
      cpu: 25,
      memory: 50,
      disk: 75,
    }
    server.use(
      http.get('*/api/compute-engines/:id/metrics', () =>
        HttpResponse.json({ data: [point] }),
      ),
    )

    await expect(getComputeEngineMetrics(id, '1h')).resolves.toEqual([point])
  })

  it('6.8c – getComputeEngineMetrics rejects a malformed successful response', async () => {
    const id = getMockComputeEngines()[0].id
    server.use(
      http.get('*/api/compute-engines/:id/metrics', () =>
        HttpResponse.json({ unexpected: true }),
      ),
    )

    await expect(getComputeEngineMetrics(id, '1h')).rejects.toThrow(
      'Compute Engine metrics response must contain an array',
    )
  })

  it('6.8d – getComputeEngineMetrics rejects a malformed point in a direct array', async () => {
    const id = getMockComputeEngines()[0].id
    server.use(
      http.get('*/api/compute-engines/:id/metrics', () =>
        HttpResponse.json([
          { timestamp: '2026-08-22T12:00:00.000Z', cpu: 25, memory: 50 },
        ]),
      ),
    )

    await expect(getComputeEngineMetrics(id, '1h')).rejects.toThrow(
      'Compute Engine metrics response must contain an array',
    )
  })

  it('6.8e – getComputeEngineMetrics rejects a malformed point in a metrics envelope', async () => {
    const id = getMockComputeEngines()[0].id
    server.use(
      http.get('*/api/compute-engines/:id/metrics', () =>
        HttpResponse.json({
          metrics: [
            { timestamp: '2026-08-22T12:00:00.000Z', cpu: '25', memory: 50, disk: 75 },
          ],
        }),
      ),
    )

    await expect(getComputeEngineMetrics(id, '1h')).rejects.toThrow(
      'Compute Engine metrics response must contain an array',
    )
  })

  it('6.8f – getComputeEngineMetrics rejects a malformed point in a data envelope', async () => {
    const id = getMockComputeEngines()[0].id
    server.use(
      http.get('*/api/compute-engines/:id/metrics', () =>
        HttpResponse.json({
          data: [{ timestamp: 123, cpu: 25, memory: 50, disk: 75 }],
        }),
      ),
    )

    await expect(getComputeEngineMetrics(id, '1h')).rejects.toThrow(
      'Compute Engine metrics response must contain an array',
    )
  })

  it('6.9 – getComputeEngine() throws AxiosError for unknown ID', async () => {
    await expect(getComputeEngine('no-such-ce-axios')).rejects.toThrow()
  })

  it('6.10 – deleteComputeEngine() throws AxiosError for unknown ID', async () => {
    await expect(deleteComputeEngine('no-such-ce-del-axios')).rejects.toThrow()
  })

  it('6.11 – patchComputeEngine() throws when immutable field (region) is sent', async () => {
    const id = getMockComputeEngines()[0].id
    // @ts-expect-error testing runtime backend validation
    await expect(patchComputeEngine(id, { region: 'IST' })).rejects.toThrow()
  })
})
