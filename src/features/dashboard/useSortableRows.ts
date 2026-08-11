import { useState, useMemo } from 'react'
import type { ServiceId, ServiceRow } from '@/lib/mockServiceData'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc' | null

/** Maps a column index (matching the `headers` array position) to its field on ServiceRow */
const DEFAULT_COL_INDEX_TO_FIELD: Record<number, keyof ServiceRow> = {
  0: 'id',
  1: 'name',
  2: 'status',
  3: 'col3',
  4: 'col4',
  5: 'col5',
  6: 'col6',
}

function getSortField(serviceId: ServiceId | undefined, colIndex: number): keyof ServiceRow | undefined {
  if (!serviceId) {
    return DEFAULT_COL_INDEX_TO_FIELD[colIndex]
  }
  if (serviceId === 'Storage' && colIndex === 6) {
    return 'col6'
  }
  const map: Record<number, keyof ServiceRow> = {
    0: 'id',
    1: 'name',
    2: 'region',
    3: 'status',
    4: 'col3',
    5: 'col4',
    6: 'col5',
    7: 'col6',
  }
  return map[colIndex] ?? DEFAULT_COL_INDEX_TO_FIELD[colIndex]
}

export interface SortState {
  colIndex: number | null
  dir: SortDir
}

export interface UseSortableRowsReturn {
  sortedRows: ServiceRow[]
  sortState: SortState
  toggleSort: (colIndex: number) => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Reusable sorting hook for any ServiceRow array.
 * Works with the positional column index that matches the `headers` array in ServiceDataset.
 * Cycling order per column: none → asc → desc → none (→ …)
 */
export function useSortableRows(rows: ServiceRow[], serviceId?: ServiceId): UseSortableRowsReturn {
  const [sortState, setSortState] = useState<SortState>({ colIndex: null, dir: null })

  const sortedRows = useMemo(() => {
    const { colIndex, dir } = sortState
    if (colIndex === null || dir === null) return rows

    const field = getSortField(serviceId, colIndex)
    if (!field) return rows

    return [...rows].sort((a, b) => {
      const av = String(a[field] ?? '').toLowerCase()
      const bv = String(b[field] ?? '').toLowerCase()

      // Numeric comparison for fields that look like numbers (e.g. "8 GB", "4 vCPU")
      const an = parseFloat(av)
      const bn = parseFloat(bv)
      const isNumeric = !isNaN(an) && !isNaN(bn)

      const cmp = isNumeric ? an - bn : av.localeCompare(bv)
      return dir === 'asc' ? cmp : -cmp
    })
  }, [rows, sortState, serviceId])

  function toggleSort(colIndex: number) {
    setSortState((prev) => {
      if (prev.colIndex !== colIndex) {
        // New column — start asc
        return { colIndex, dir: 'asc' }
      }
      // Same column — cycle asc → desc → null
      const next: SortDir = prev.dir === 'asc' ? 'desc' : prev.dir === 'desc' ? null : 'asc'
      return { colIndex, dir: next }
    })
  }

  return { sortedRows, sortState, toggleSort }
}
