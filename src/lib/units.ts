/**
 * GiB → MiB. Wire unit for `memory` on compute-engine and database APIs.
 *
 * Source backing range 512–65536:
 * - compute-service/internal/service/compute_engine.go:291
 * - database-service/internal/service/database.go:401
 */
export function gibToMib(gib: number): number {
  return Math.round(gib * 1024)
}

/**
 * MiB → GiB. Inverse of gibToMib, for display.
 *
 * Source backing range 512–65536:
 * - compute-service/internal/service/compute_engine.go:291
 * - database-service/internal/service/database.go:401
 */
export function mibToGib(mib: number): number {
  return mib / 1024
}
