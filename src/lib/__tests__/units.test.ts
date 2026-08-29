import { describe, it, expect } from 'vitest'
import { gibToMib, mibToGib } from '../units'

describe('units', () => {
  describe('gibToMib', () => {
    it('converts GiB to MiB as an integer', () => {
      expect(gibToMib(0.5)).toBe(512)
      expect(gibToMib(1)).toBe(1024)
      expect(gibToMib(2)).toBe(2048)
      expect(gibToMib(4)).toBe(4096)
    })

    it('rounds to avoid fractional wire types', () => {
      expect(gibToMib(0.333333)).toBe(341)
    })
  })

  describe('mibToGib', () => {
    it('converts MiB to GiB', () => {
      expect(mibToGib(512)).toBe(0.5)
      expect(mibToGib(1024)).toBe(1)
      expect(mibToGib(2048)).toBe(2)
      expect(mibToGib(4096)).toBe(4)
    })
  })
})
