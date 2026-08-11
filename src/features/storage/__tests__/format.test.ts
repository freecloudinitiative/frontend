/**
 * PR #21 — formatBytes() unit tests
 * Test Scenario 1.2 / 11.2: human-readable size formatting for the bucket table and Objects tab.
 */
import { describe, it, expect } from 'vitest'
import { formatBytes } from '@/features/storage/format'

describe('formatBytes()', () => {
  it('0 bytes → "0 B"', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('negative bytes → "0 B"', () => {
    expect(formatBytes(-100)).toBe('0 B')
  })

  it('formats bytes under 1 KB with the B unit', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('formats kilobytes with one decimal', () => {
    expect(formatBytes(100 * 1024)).toBe('100.0 KB')
  })

  it('formats megabytes (e.g. object file sizes)', () => {
    expect(formatBytes(256 * 1024 * 1024)).toBe('256.0 MB')
  })

  it('formats gigabytes (e.g. bucket totalSize)', () => {
    expect(formatBytes(2.5 * 1024 ** 3)).toBe('2.5 GB')
  })

  it('formats terabytes for very large buckets/files', () => {
    expect(formatBytes(1.5 * 1024 ** 4)).toBe('1.5 TB')
  })

  it('caps at TB for sizes larger than 1024 TB (no PB unit)', () => {
    expect(formatBytes(2048 * 1024 ** 4)).toBe('2048.0 TB')
  })
})
