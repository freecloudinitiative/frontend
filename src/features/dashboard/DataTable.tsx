import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable as useReactTable,
  type LegacyColumnDef as ColumnDef,
} from '@tanstack/react-table/legacy'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'

interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: ColumnDef<T>[]
  onRowClick: (row: T) => void
  selectedRowId: string | null
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  renderActions?: (row: T) => React.ReactNode
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  emptyMessage?: string
  pageSize?: number
}

/** Structural styling for known column ids, matching the legacy hand-rolled table's per-column look. */
function structuralCellStyle(columnId: string, isSelected: boolean): React.CSSProperties | undefined {
  if (columnId === 'id') {
    return {
      fontFamily: 'monospace',
      fontSize: '0.72rem',
      color: 'var(--dash-text-dim)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }
  }
  if (columnId === 'name') {
    return { color: isSelected ? 'var(--dash-row-selected-text)' : 'var(--dash-label)' }
  }
  if (columnId === 'col6') {
    return { color: 'var(--dash-text-dim)' }
  }
  return undefined
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  selectedRowId,
  globalFilter,
  onGlobalFilterChange,
  renderActions,
  isLoading = false,
  isError = false,
  errorMessage,
  emptyMessage = 'No resources yet',
  pageSize = 10,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: (updater) =>
      onGlobalFilterChange(typeof updater === 'function' ? updater(globalFilter) : updater),
    initialState: {
      sorting: [{ id: 'name', desc: false }],
      pagination: { pageIndex: 0, pageSize },
    },
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const colSpan = columns.length + (renderActions ? 1 : 0)
  const rows = table.getRowModel().rows

  return (
    <>
      <table className="fci-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const dir = header.column.getIsSorted()
                const isId = header.column.id === 'id'
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={`fci-th-sortable${isId ? ' fci-col-id' : ''}`}
                    aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
                  >
                    <button
                      type="button"
                      className="fci-th-btn"
                      aria-label={`Sort by ${typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : header.column.id}${dir ? `, ${dir === 'asc' ? 'ascending' : 'descending'}` : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className={`fci-sort-indicator${dir ? ' fci-sort-active' : ''}`} aria-hidden="true">
                        {dir === 'asc' ? ' ▲' : dir === 'desc' ? ' ▼' : ' ⇅'}
                      </span>
                    </button>
                  </th>
                )
              })}
              {renderActions && <th scope="col" style={{ width: '1%', whiteSpace: 'nowrap' }}><span className="sr-only">Actions</span></th>}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={colSpan} style={{ textAlign: 'center', padding: '2.5rem 1rem', fontSize: '0.85rem' }}>
                <DashboardLoading />
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td
                colSpan={colSpan}
                style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#e0546a', letterSpacing: '0.08em', fontSize: '0.85rem' }}
              >
                ✗ Failed to load data{errorMessage ? ` — ${errorMessage}` : ''}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={colSpan}
                style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--dash-text-dim)', letterSpacing: '0.08em', fontSize: '0.85rem' }}
              >
                {data.length === 0 ? emptyMessage : 'No matching rows'}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const isSelected = row.original.id === selectedRowId
              return (
                <tr
                  key={row.id}
                  role="row"
                  tabIndex={0}
                  style={{
                    background: isSelected ? 'var(--dash-row-selected-bg)' : 'transparent',
                    color: isSelected ? 'var(--dash-row-selected-text)' : 'var(--dash-text)',
                  }}
                  onClick={() => onRowClick(row.original)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick(row.original)
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cell.column.id === 'id' ? 'fci-col-id' : undefined}
                      style={structuralCellStyle(cell.column.id, isSelected)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="fci-td-actions" onClick={(e) => e.stopPropagation()}>
                      {renderActions(row.original)}
                    </td>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
      <div className="fci-table-pagination">
        <button
          type="button"
          className="fci-linkbtn"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          aria-label="Previous page"
        >
          {'<'}
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </span>
        <button
          type="button"
          className="fci-linkbtn"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          aria-label="Next page"
        >
          {'>'}
        </button>
      </div>
    </>
  )
}
