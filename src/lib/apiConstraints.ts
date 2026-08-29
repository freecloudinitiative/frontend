/**
 * Public-API constraint fixtures — frontend source of truth.
 *
 * Every numeric bound and every enum member below was transcribed from the Go
 * validator that the backend actually enforces. The trailing comment on each
 * value names the exact file.go:line it came from. A reviewer must be able to
 * verify any entry against one named line without searching.
 *
 * Rules:
 *  1. These constants are TRANSCRIBED, not generated.
 *  2. Any change to a Go range or enum MUST update this file in the same
 *     change set — never update only one side.
 *  3. No form, payload, or component imports from this module; it is a
 *     test-and-mock contract only.
 *
 * Source repos (relative to monorepo root):
 *  - compute-service/internal/service/compute_engine.go
 *  - compute-service/internal/projection/images.go
 *  - database-service/internal/service/database.go
 *  - database-service/internal/projection/versions.go
 *  - storage-service/internal/service/network.go
 *  - storage-service/internal/service/bucket.go
 *  - storage-service/internal/api/types.go
 *  - iam-service/internal/api/types.go
 */

import { COMPUTE_ENGINE_OS_OPTIONS } from '@/features/computeEngine/constants'

// ---------------------------------------------------------------------------
// Compute Engine
// Source: compute-service/internal/service/compute_engine.go:290-292
// Source: compute-service/internal/api/types.go:56-68
// ---------------------------------------------------------------------------

export const COMPUTE_ENGINE_CONSTRAINTS = {
  cpu: { min: 1, max: 16 }, // compute_engine.go:290
  memoryMib: { min: 512, max: 65536 }, // compute_engine.go:291
  diskGib: { min: 10, max: 1000 }, // compute_engine.go:292
  regions: ['ANK', 'IST'] as const, // compute_engine.go:290 (region enum)
  os: COMPUTE_ENGINE_OS_OPTIONS, // images.go (all nine identifiers)
} as const

// ---------------------------------------------------------------------------
// Database
// Source: database-service/internal/service/database.go:399-402
// Source: database-service/internal/projection/versions.go:16-17
// ---------------------------------------------------------------------------

export const DATABASE_CONSTRAINTS = {
  cpu: { min: 1, max: 8 }, // database.go:400
  memoryMib: { min: 512, max: 16384 }, // database.go:401
  storageSize: { min: 10, max: 500 }, // database.go:402
  versions: ['16', '17'] as const, // versions.go:16-17
} as const

// ---------------------------------------------------------------------------
// Bucket (Storage)
// Source: storage-service/internal/service/bucket.go:69-70, :440-455
// Source: storage-service/internal/api/types.go:49-55, :232-239
// ---------------------------------------------------------------------------

export const BUCKET_CONSTRAINTS = {
  regions: ['ANK', 'IST'] as const, // bucket.go:69-70
  access: ['private', 'public-read', 'public-read-write'] as const, // bucket.go:440-455
} as const

// ---------------------------------------------------------------------------
// Network
// Source: storage-service/internal/service/network.go:334-355
// Source: storage-service/internal/api/types.go:232-239
// ---------------------------------------------------------------------------

export const NETWORK_CONSTRAINTS = {
  regions: ['ANK', 'IST'] as const, // network.go:334
  types: ['vpc', 'subnet', 'public'] as const, // network.go:335-355
} as const

// ---------------------------------------------------------------------------
// IAM User
// Source: iam-service/internal/api/types.go:207-211
// ---------------------------------------------------------------------------

export const IAM_USER_CONSTRAINTS = {
  roles: ['admin', 'editor', 'viewer', 'auditor'] as const, // types.go:207-211
} as const
