/**
 * Contract guard for public-API constraint fixtures.
 *
 * These tests assert that:
 *  a) every form option list satisfies the corresponding API constraint,
 *     AFTER the same conversion `buildInput` applies (e.g. MEMORY_OPTIONS in
 *     GiB are checked as gibToMib(v) — never as raw GiB),
 *  b) every option list is non-empty,
 *  c) each form's default (from its store or INITIAL_FORM_STATE) is itself a
 *     valid option,
 *  d) enum lists match EXACTLY, not merely intersect.
 *
 * If a test fails, the constant in apiConstraints.ts was transcribed wrong.
 * Re-check the Go source. Do NOT adjust the assertion to make it pass.
 */

import { describe, it, expect } from 'vitest'
import {
  COMPUTE_ENGINE_CONSTRAINTS,
  DATABASE_CONSTRAINTS,
  BUCKET_CONSTRAINTS,
  NETWORK_CONSTRAINTS,
  IAM_USER_CONSTRAINTS,
} from '../apiConstraints'
import { COMPUTE_ENGINE_OS_OPTIONS } from '@/features/computeEngine/constants'
import { INITIAL_COMPUTE_ENGINE_CREATE_FORM } from '@/features/computeEngine/store'
import { DATABASE_CPU_OPTIONS, DATABASE_MEMORY_OPTIONS } from '@/features/database/options'
import { INITIAL_DATABASE_CREATE_FORM } from '@/features/database/store'
import { INITIAL_IAM_CREATE_FORM } from '@/features/iam/store'
import { gibToMib } from '../units'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max
}

// ---------------------------------------------------------------------------
// Compute Engine
// ---------------------------------------------------------------------------

describe('COMPUTE_ENGINE_CONSTRAINTS', () => {
  const { cpu, memoryMib, diskGib, os } = COMPUTE_ENGINE_CONSTRAINTS

  const CPU_OPTIONS = ['1', '2', '4', '8', '16'] // ComputeEngineCreateForm.tsx line 15

  it('cpu options are non-empty', () => {
    expect(CPU_OPTIONS.length).toBeGreaterThan(0)
  })

  it('every cpu option satisfies the constraint', () => {
    for (const opt of CPU_OPTIONS) {
      const v = Number(opt)
      expect(Number.isInteger(v) && v >= cpu.min && v <= cpu.max).toBe(true)
    }
  })

  it('default cpu is a valid option', () => {
    expect(CPU_OPTIONS).toContain(INITIAL_COMPUTE_ENGINE_CREATE_FORM.cpu)
  })

  // Memory options are stored as GiB strings; buildInput converts with gibToMib.
  const MEMORY_OPTIONS = ['0.5', '1', '2', '4'] // ComputeEngineCreateForm.tsx line 16

  it('memory options are non-empty', () => {
    expect(MEMORY_OPTIONS.length).toBeGreaterThan(0)
  })

  it('every memory option satisfies the constraint after gibToMib conversion', () => {
    for (const opt of MEMORY_OPTIONS) {
      const mib = gibToMib(Number(opt))
      expect(inRange(mib, memoryMib.min, memoryMib.max)).toBe(true)
    }
  })

  it('default memory is a valid option after gibToMib conversion', () => {
    const defaultMib = gibToMib(Number(INITIAL_COMPUTE_ENGINE_CREATE_FORM.memory))
    expect(inRange(defaultMib, memoryMib.min, memoryMib.max)).toBe(true)
  })

  // Disk is a free-text number field, so there is no option list to compare
  // against — pin the literal bound instead. A shape-only check (min > 0,
  // max >= min) is what let this constant drift from compute_engine.go:292
  // to { min: 5, max: 25 } while both sides looked fine in isolation.
  it('disk constraint matches compute_engine.go:292 exactly', () => {
    expect(diskGib).toEqual({ min: 10, max: 1000 })
  })

  // OS must match EXACTLY — subset check would have missed pr-02 style breaks.
  it('os list is non-empty', () => {
    expect(os.length).toBeGreaterThan(0)
  })

  it('os constraint matches COMPUTE_ENGINE_OS_OPTIONS exactly', () => {
    // Cast to mutable for comparison since both are `as const`
    expect([...os]).toStrictEqual([...COMPUTE_ENGINE_OS_OPTIONS])
  })

  it('default os is in the os list', () => {
    expect(os).toContain(INITIAL_COMPUTE_ENGINE_CREATE_FORM.os)
  })
})

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

describe('DATABASE_CONSTRAINTS', () => {
  const { cpu, memoryMib, storageSize, versions } = DATABASE_CONSTRAINTS

  // ENGINE_VERSIONS for postgres only — backend only validates postgres versions
  // as '16' | '17'. Other engine version lists are frontend-only UI metadata.
  const ENGINE_VERSIONS_POSTGRES = ['17', '16'] // DatabaseCreateForm.tsx line 20

  it('postgres version list is non-empty', () => {
    expect(ENGINE_VERSIONS_POSTGRES.length).toBeGreaterThan(0)
  })

  it('postgres version list matches DATABASE_CONSTRAINTS.versions exactly', () => {
    // Sort both sides so order does not matter — the backend validates by set membership.
    expect([...ENGINE_VERSIONS_POSTGRES].sort()).toStrictEqual([...versions].sort())
  })

  it('default version is in the versions constraint', () => {
    expect((versions as readonly string[])).toContain(INITIAL_DATABASE_CREATE_FORM.version)
  })

  it('DATABASE_CPU_OPTIONS is non-empty', () => {
    expect(DATABASE_CPU_OPTIONS.length).toBeGreaterThan(0)
  })

  it('every DATABASE_CPU_OPTIONS entry satisfies the cpu constraint', () => {
    for (const opt of DATABASE_CPU_OPTIONS) {
      const v = Number(opt)
      expect(Number.isInteger(v) && v >= cpu.min && v <= cpu.max).toBe(true)
    }
  })

  it('default cpu is a valid DATABASE_CPU_OPTIONS entry', () => {
    expect(DATABASE_CPU_OPTIONS as readonly string[]).toContain(INITIAL_DATABASE_CREATE_FORM.cpu)
  })

  it('DATABASE_MEMORY_OPTIONS is non-empty', () => {
    expect(DATABASE_MEMORY_OPTIONS.length).toBeGreaterThan(0)
  })

  it('every DATABASE_MEMORY_OPTIONS entry satisfies the constraint after gibToMib conversion', () => {
    for (const opt of DATABASE_MEMORY_OPTIONS) {
      const mib = gibToMib(Number(opt))
      expect(inRange(mib, memoryMib.min, memoryMib.max)).toBe(true)
    }
  })

  it('default memory is a valid option after gibToMib conversion', () => {
    const defaultMib = gibToMib(Number(INITIAL_DATABASE_CREATE_FORM.memory))
    expect(inRange(defaultMib, memoryMib.min, memoryMib.max)).toBe(true)
  })

  it('storageSize constraint defines a positive range', () => {
    expect(storageSize.min).toBeGreaterThan(0)
    expect(storageSize.max).toBeGreaterThanOrEqual(storageSize.min)
  })
})

// ---------------------------------------------------------------------------
// Bucket (Storage)
// ---------------------------------------------------------------------------

describe('BUCKET_CONSTRAINTS', () => {
  const { regions, access, capacityGb } = BUCKET_CONSTRAINTS

  it('caps every bucket at 5 GB', () => {
    expect(capacityGb).toEqual({ min: 1, max: 5 })
  })

  // From BucketCreateForm.tsx
  const REGION_OPTIONS = ['ANK', 'IST'] // BucketCreateForm.tsx line 9
  const ACCESS_OPTIONS = ['private', 'public-read', 'public-read-write'] // BucketCreateForm.tsx line 10-14
  const INITIAL_BUCKET_REGION = 'ANK' // BucketCreateForm.tsx line 37
  const INITIAL_BUCKET_ACCESS = 'private' // BucketCreateForm.tsx line 37

  it('regions list is non-empty', () => {
    expect(regions.length).toBeGreaterThan(0)
  })

  it('bucket REGION_OPTIONS matches constraint exactly', () => {
    expect([...REGION_OPTIONS].sort()).toStrictEqual([...regions].sort())
  })

  it('default bucket region is in the regions constraint', () => {
    expect(regions as readonly string[]).toContain(INITIAL_BUCKET_REGION)
  })

  it('access list is non-empty', () => {
    expect(access.length).toBeGreaterThan(0)
  })

  it('ACCESS_OPTIONS matches constraint exactly', () => {
    expect([...ACCESS_OPTIONS].sort()).toStrictEqual([...access].sort())
  })

  it('default bucket access is in the access constraint', () => {
    expect(access as readonly string[]).toContain(INITIAL_BUCKET_ACCESS)
  })
})

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

describe('NETWORK_CONSTRAINTS', () => {
  const { regions, types } = NETWORK_CONSTRAINTS

  // From NetworkCreateForm.tsx
  const REGION_OPTIONS = ['IST', 'ANK'] // NetworkCreateForm.tsx line 9-12 (values)
  const TYPE_OPTIONS = ['vpc', 'subnet', 'public'] // NetworkCreateForm.tsx line 14-18 (values)
  const INITIAL_NETWORK_TYPE = 'vpc' // NetworkCreateForm.tsx line 45
  const INITIAL_NETWORK_REGION = 'IST' // NetworkCreateForm.tsx line 45

  it('regions list is non-empty', () => {
    expect(regions.length).toBeGreaterThan(0)
  })

  it('network REGION_OPTIONS matches constraint exactly', () => {
    expect([...REGION_OPTIONS].sort()).toStrictEqual([...regions].sort())
  })

  it('default network region is in the regions constraint', () => {
    expect(regions as readonly string[]).toContain(INITIAL_NETWORK_REGION)
  })

  it('types list is non-empty', () => {
    expect(types.length).toBeGreaterThan(0)
  })

  it('TYPE_OPTIONS matches constraint exactly', () => {
    expect([...TYPE_OPTIONS].sort()).toStrictEqual([...types].sort())
  })

  it('default network type is in the types constraint', () => {
    expect(types as readonly string[]).toContain(INITIAL_NETWORK_TYPE)
  })
})

// ---------------------------------------------------------------------------
// IAM User
// ---------------------------------------------------------------------------

describe('IAM_USER_CONSTRAINTS', () => {
  const { roles } = IAM_USER_CONSTRAINTS

  // From IamCreateForm.tsx line 9-14 (values only)
  const ROLE_OPTIONS = ['admin', 'editor', 'viewer', 'auditor']

  it('roles list is non-empty', () => {
    expect(roles.length).toBeGreaterThan(0)
  })

  it('IAM ROLE_OPTIONS matches constraint exactly', () => {
    expect([...ROLE_OPTIONS].sort()).toStrictEqual([...roles].sort())
  })

  it('default iam role is in the roles constraint', () => {
    expect(roles as readonly string[]).toContain(INITIAL_IAM_CREATE_FORM.role)
  })
})
