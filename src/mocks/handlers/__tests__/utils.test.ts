import { describe, expect, it } from 'vitest'
import { createGetByIdHandler, createDeleteHandler, createSettingsPatchHandler } from '../utils'

describe('MSW Handler Utilities (utils.ts)', () => {
  it('creates a GET by ID handler', () => {
    const lookup = (id: string) => (id === '1' ? { id: '1', name: 'item-1' } : undefined)
    const handler = createGetByIdHandler('*/api/test/:id', lookup, 'TestItem', () => 0)

    expect(handler).toBeDefined()
    expect(handler.info.header).toBe('GET */api/test/:id')
  })

  it('creates a DELETE by ID handler', () => {
    const deleteFn = (id: string) => id === '1'
    const handler = createDeleteHandler('*/api/test/:id', deleteFn, 'TestItem', () => 0)

    expect(handler).toBeDefined()
    expect(handler.info.header).toBe('DELETE */api/test/:id')
  })

  it('creates a settings PATCH handler', () => {
    const lookup = (id: string) => (id === '1' ? { id: '1', name: 'item-1' } : undefined)
    const handler = createSettingsPatchHandler('*/api/test/:id/settings', lookup, 'TestItem', () => 0)

    expect(handler).toBeDefined()
    expect(handler.info.header).toBe('PATCH */api/test/:id/settings')
  })
})
