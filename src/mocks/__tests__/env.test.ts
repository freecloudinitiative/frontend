import { describe, it, expect } from 'vitest'
import { shouldStartMsw } from '@/mocks/env'

describe('shouldStartMsw', () => {
  it('returns true when appEnv is "nonprod"', () => {
    expect(shouldStartMsw('nonprod')).toBe(true)
  })

  it('returns false when appEnv is "prod"', () => {
    expect(shouldStartMsw('prod')).toBe(false)
  })

  it('returns true when appEnv is undefined (default behavior)', () => {
    expect(shouldStartMsw(undefined)).toBe(true)
  })

  it('returns true when appEnv is an empty string or unexpected value', () => {
    expect(shouldStartMsw('')).toBe(true)
    expect(shouldStartMsw('staging')).toBe(true)
  })
})
