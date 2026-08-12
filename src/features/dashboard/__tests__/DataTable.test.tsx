import { useState } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { DataTable } from '@/features/dashboard/DataTable'

interface Row {
  id: string
  name: string
  status: string
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id', header: '#' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
]

function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    name: `row-${String(count - i).padStart(2, '0')}`, // descending names so default asc-sort is observable
    status: i % 2 === 0 ? 'running' : 'stopped',
  }))
}

function Harness({
  data,
  selectedRowId: selectedRowIdProp,
  ...rest
}: { data: Row[] } & Partial<Omit<React.ComponentProps<typeof DataTable<Row>>, 'data' | 'columns'>>) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedRowId, setSelectedRowId] = useState<string | null>(selectedRowIdProp ?? null)
  return (
    <DataTable
      data={data}
      columns={columns}
      onRowClick={(row) => setSelectedRowId(row.id)}
      selectedRowId={selectedRowIdProp !== undefined ? selectedRowIdProp : selectedRowId}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      {...rest}
    />
  )
}

describe('DataTable — PR #31 react-table migration', () => {
  it('sorts by name ascending by default', () => {
    render(<Harness data={makeRows(5)} />)
    const bodyRows = screen.getAllByRole('row').slice(1) // skip header row
    expect(within(bodyRows[0]).getByText(/^row-/).textContent).toBe('row-01')
  })

  it('clicking a sortable header toggles sort direction', () => {
    render(<Harness data={makeRows(5)} />)
    const nameHeaderBtn = screen.getByRole('button', { name: /Name/i })

    // Default asc — first row is row-01. Click once -> desc.
    fireEvent.click(nameHeaderBtn)
    let bodyRows = screen.getAllByRole('row').slice(1)
    expect(within(bodyRows[0]).getByText(/^row-/).textContent).toBe('row-05')

    // Click again -> asc.
    fireEvent.click(nameHeaderBtn)
    bodyRows = screen.getAllByRole('row').slice(1)
    expect(within(bodyRows[0]).getByText(/^row-/).textContent).toBe('row-01')
  })

  it('shows ascending/descending indicators on the sorted column', () => {
    render(<Harness data={makeRows(3)} />)
    const nameHeader = screen.getByRole('columnheader', { name: /Name/i })
    expect(nameHeader.getAttribute('aria-sort')).toBe('ascending')

    fireEvent.click(screen.getByRole('button', { name: /Name/i }))
    expect(screen.getByRole('columnheader', { name: /Name/i }).getAttribute('aria-sort')).toBe('descending')
  })

  it('globalFilter narrows visible rows to matching text', () => {
    const { rerender } = render(<Harness data={makeRows(5)} globalFilter="" onGlobalFilterChange={() => {}} />)
    expect(screen.getAllByRole('row')).toHaveLength(6) // 1 header + 5 data rows

    rerender(<Harness data={makeRows(5)} globalFilter="row-03" onGlobalFilterChange={() => {}} />)
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(2) // 1 header + 1 matching data row
    expect(within(rows[1]).getByText('row-03')).toBeInTheDocument()
  })

  it('shows "No matching rows" when the filter matches nothing but data exists', () => {
    render(<Harness data={makeRows(5)} globalFilter="no-such-row" onGlobalFilterChange={() => {}} />)
    expect(screen.getByText('No matching rows')).toBeInTheDocument()
  })

  it('paginates 25 rows into 3 pages of 10/10/5 and disables bounds', () => {
    render(<Harness data={makeRows(25)} />)

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    const prevBtn = screen.getByRole('button', { name: '<' })
    const nextBtn = screen.getByRole('button', { name: '>' })
    expect(prevBtn).toBeDisabled()
    expect(nextBtn).not.toBeDisabled()
    expect(screen.getAllByRole('row')).toHaveLength(11) // header + 10 rows

    fireEvent.click(nextBtn)
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()

    fireEvent.click(nextBtn)
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(6) // header + 5 remaining rows
    expect(nextBtn).toBeDisabled()

    fireEvent.click(prevBtn)
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
  })

  it('applies the selected-row highlight style to the matching row', () => {
    const rows = makeRows(3)
    render(<Harness data={rows} selectedRowId={rows[1].id} />)
    const bodyRows = screen.getAllByRole('row').slice(1)
    const selected = bodyRows.find((r) => within(r).queryByText(rows[1].name))
    expect(selected).toBeDefined()
    expect(selected?.style.background).toBe('var(--dash-row-selected-bg)')
  })

  it('calls onRowClick with the row data when a row is clicked', () => {
    const onRowClick = vi.fn()
    const rows = makeRows(3)
    render(
      <DataTable
        data={rows}
        columns={columns}
        onRowClick={onRowClick}
        selectedRowId={null}
        globalFilter=""
        onGlobalFilterChange={() => {}}
      />,
    )
    const bodyRows = screen.getAllByRole('row').slice(1)
    fireEvent.click(bodyRows[0])
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick.mock.calls[0][0]).toMatchObject({ name: 'row-01' })
  })

  it('renders renderActions content and clicking it does not trigger onRowClick', () => {
    const onRowClick = vi.fn()
    const onActionClick = vi.fn()
    const rows = makeRows(2)
    render(
      <DataTable
        data={rows}
        columns={columns}
        onRowClick={onRowClick}
        selectedRowId={null}
        globalFilter=""
        onGlobalFilterChange={() => {}}
        renderActions={(row) => (
          <button type="button" onClick={onActionClick}>
            Delete {row.name}
          </button>
        )}
      />,
    )
    const deleteBtn = screen.getByRole('button', { name: 'Delete row-02' })
    fireEvent.click(deleteBtn)
    expect(onActionClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('shows a loading indicator instead of rows when isLoading', () => {
    render(<Harness data={[]} isLoading />)
    expect(screen.getByText('[ LOADING... ]')).toBeInTheDocument()
  })

  it('shows an error message instead of rows when isError', () => {
    render(<Harness data={[]} isError errorMessage="network down" />)
    expect(screen.getByText(/network down/)).toBeInTheDocument()
  })

  it('shows the empty message when there is no data at all', () => {
    render(<Harness data={[]} emptyMessage="Nothing here yet" />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })
})
