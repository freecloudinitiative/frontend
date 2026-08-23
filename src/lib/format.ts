import type { ServiceDataset } from '@/features/dashboard/serviceCatalog'

/** `2026-08-10T02:00:00Z` → locale-formatted date string, shared across every tab/detail view. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString()
}

/** `2026-08-10T02:00:00Z` → locale-formatted date + time string (activity logs). */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

/** Human-readable byte size (e.g. bucket totals, object/file sizes), capped at TB. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return '0 B'
  const exponent = Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1))
  const value = bytes / 1024 ** exponent
  return `${exponent === 0 ? value : value.toFixed(1)} ${BYTE_UNITS[exponent]}`
}

/** Title-cases a raw status value (`'running'` → `'Running'`) to match `statusColors` keys. */
export function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

/** Resolves a raw status value to its dataset color, falling back to the default text color. */
export function resolveStatusColor(dataset: Pick<ServiceDataset, 'statusColors'>, status: string): string {
  return dataset.statusColors[formatStatusLabel(status)] ?? 'var(--dash-text)'
}
