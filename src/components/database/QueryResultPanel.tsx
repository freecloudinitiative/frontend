import { useMemo } from 'react'
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getSortedRowModel,
  useLegacyTable as useReactTable,
  type LegacyColumnDef as ColumnDef,
} from '@tanstack/react-table/legacy'
import type { SqlExecutionResult } from '@/features/database/types'
import { useDatabaseStore } from '@/features/database/store'

const MAX_DISPLAYED_ROWS = 100

interface QueryResultPanelProps {
  status: 'idle' | 'loading' | 'error' | 'success'
  result: SqlExecutionResult | null
}

export function QueryResultPanel({ status, result }: QueryResultPanelProps) {
  const sorting = useDatabaseStore((state) => state.sorting)
  const setSorting = useDatabaseStore((state) => state.setSorting)

  const rows = useMemo(() => result?.resultData?.slice(0, MAX_DISPLAYED_ROWS) ?? [], [result])
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (rows.length === 0) return []
    return Object.keys(rows[0]).map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info: { getValue: () => unknown }) => String(info.getValue() ?? ''),
    }))
  }, [rows])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (status === 'idle') {
    return (
      <div className="fci-tab-content">
        <div style={{ color: 'var(--dash-text-dim)' }}>Run a query to see results here.</div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="fci-tab-content">
        <div className="fci-blink" style={{ color: 'var(--dash-text-dim)' }}>⏳ Executing SQL…</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="fci-tab-content">
        <div role="alert" style={{ color: '#e0546a' }}>
          ⚠ {result?.errorMessage ?? 'Query failed'}
        </div>
        {result?.executedAt && (
          <div style={{ color: 'var(--dash-text-dim)', marginTop: 6, fontSize: 11 }}>
            Executed at {result.executedAt}
          </div>
        )}
      </div>
    )
  }

  const hasResultSet = Boolean(result?.resultData)

  return (
    <div className="fci-tab-content">
      {hasResultSet ? (
        <>
          <div className="fci-section-title">{rows.length} rows returned</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="fci-table fci-result-panel">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const dir = header.column.getIsSorted()
                      return (
                        <th key={header.id} className="fci-th-sortable" aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}>
                          <button type="button" className="fci-th-btn" onClick={header.column.getToggleSortingHandler()}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <span className={`fci-sort-indicator${dir ? ' fci-sort-active' : ''}`} aria-hidden="true">
                              {dir === 'asc' ? ' ▲' : dir === 'desc' ? ' ▼' : ' ⇅'}
                            </span>
                          </button>
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ color: '#7ec87e' }}>✓ {result?.rowsAffected ?? 0} rows affected</div>
      )}
      {result?.executedAt && (
        <div style={{ color: 'var(--dash-text-dim)', marginTop: 10, fontSize: 11 }}>
          Executed at {result.executedAt}
        </div>
      )}
    </div>
  )
}
