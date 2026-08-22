import { describe, it, expect } from 'vitest'
import { shouldStartMsw } from '@/mocks/env'

describe('shouldStartMsw', () => {
  it('returns true when appEnv is "nonprod"', () => {
    expect(shouldStartMsw('nonprod', true)).toBe(true)
  })

  it('returns false for a production build even when appEnv is "nonprod"', () => {
    expect(shouldStartMsw('nonprod', false)).toBe(false)
  })

  it('returns false when appEnv is "prod"', () => {
    expect(shouldStartMsw('prod')).toBe(false)
  })

  it('returns false when appEnv is undefined', () => {
    expect(shouldStartMsw(undefined)).toBe(false)
  })

  it('returns false when appEnv is an empty string or unexpected value', () => {
    expect(shouldStartMsw('')).toBe(false)
    expect(shouldStartMsw('staging')).toBe(false)
  })
})
