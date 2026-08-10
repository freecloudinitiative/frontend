import type { SortDir } from './useSortableRows'

interface SortableHeaderProps {
  /** Column label text */
  label: string
  /** Position index of this column in the headers array */
  colIndex: number
  /** Current sort direction for this column, or null if not sorted */
  dir: SortDir
  /** Called when the header is clicked */
  onSort: (colIndex: number) => void
}

const INDICATOR: Record<NonNullable<SortDir>, string> = {
  asc:  ' ▲',
  desc: ' ▼',
}

/**
 * A reusable <th> that shows an ASC/DESC indicator and handles click-to-sort.
 * Designed to be used with useSortableRows().
 */
export function SortableHeader({ label, colIndex, dir, onSort }: SortableHeaderProps) {
  return (
    <th
      className="fci-th-sortable"
      aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
    >
      <button
        type="button"
        className="fci-th-btn"
        onClick={() => onSort(colIndex)}
      >
        {label}
        <span
          className={`fci-sort-indicator${dir ? ' fci-sort-active' : ''}`}
          aria-hidden="true"
        >
          {dir ? INDICATOR[dir] : ' ⇅'}
        </span>
      </button>
    </th>
  )
}
