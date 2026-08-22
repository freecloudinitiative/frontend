/**
 * PR #21 — formatBytes() unit tests
 * Test Scenario 1.2 / 11.2: human-readable size formatting for the bucket table and Objects tab.
 *
 * DRY_REFACTOR_TEST_SCENARIOS.md §7.13 — also covers formatDate/resolveStatusColor,
 * the two other functions centralized into this file by the DRY refactor (findings 4.1, 4.2).
 */
import { describe, it, expect } from 'vitest'
import { formatBytes, formatDate, formatStatusLabel, resolveStatusColor } from '@/lib/format'
import { SERVICE_DATASETS } from '@/features/dashboard/serviceCatalog'

describe('formatBytes()', () => {
  it('0 bytes → "0 B"', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('negative bytes → "0 B"', () => {
    expect(formatBytes(-100)).toBe('0 B')
  })

  it('formats fractional positive bytes under 1 B with the B unit', () => {
    expect(formatBytes(0.5)).toBe('0.5 B')
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

describe('formatDate()', () => {
  it('formats a valid ISO date string using the locale date format', () => {
    // toLocaleDateString() output is locale/timezone-dependent, so assert shape not exact string
    expect(formatDate('2026-08-10T02:00:00Z')).toMatch(/\d/)
    expect(formatDate('2026-08-10T02:00:00Z')).toBe(new Date('2026-08-10T02:00:00Z').toLocaleDateString())
  })

  it('produces the same output as the pre-refactor inline `new Date(x).toLocaleDateString()` call', () => {
    // This is the exact expression every call site used before centralization (DetailPanel,
    // StorageTabContent, IamTabContent, MyAccountPage, DashboardPage) — a golden-value guard
    // against the extraction changing formatting.
    const iso = '2025-01-15T10:30:00Z'
    expect(formatDate(iso)).toBe(new Date(iso).toLocaleDateString())
  })

  it('does not throw on a malformed date string (matches pre-refactor inline behavior)', () => {
    // Pre-refactor, every call site was a bare `new Date(x).toLocaleDateString()` with no
    // validation, which returns the literal string "Invalid Date" rather than throwing. The
    // refactor is a pure extraction, so it intentionally preserves this — not introducing new
    // fallback/validation behavior that didn't exist before.
    expect(() => formatDate('not-a-date')).not.toThrow()
    expect(formatDate('not-a-date')).toBe('Invalid Date')
  })
})

describe('formatStatusLabel()', () => {
  it('capitalizes the first letter, leaving the rest unchanged', () => {
    expect(formatStatusLabel('running')).toBe('Running')
    expect(formatStatusLabel('read-only')).toBe('Read-only')
  })
})

describe('resolveStatusColor()', () => {
  it('returns the mapped color for a known status, case-insensitively via title-casing', () => {
    const dataset = SERVICE_DATASETS['Compute Engine']
    expect(resolveStatusColor(dataset, 'running')).toBe(dataset.statusColors.Running)
    expect(resolveStatusColor(dataset, 'stopped')).toBe(dataset.statusColors.Stopped)
  })

  it('falls back to var(--dash-text) for an unmapped status, matching the original inline `?? \'var(--dash-text)\'` fallback', () => {
    const dataset = SERVICE_DATASETS['Compute Engine']
    expect(resolveStatusColor(dataset, 'unknown-status')).toBe('var(--dash-text)')
  })

  it('resolves the same status to the same color across every service dataset (no divergent palette)', () => {
    const services = ['Compute Engine', 'Database', 'IAM', 'Network', 'Storage'] as const
    for (const service of services) {
      const dataset = SERVICE_DATASETS[service]
      if ('Active' in dataset.statusColors) {
        expect(resolveStatusColor(dataset, 'active')).toBe('#7ec87e')
      }
    }
  })
})
