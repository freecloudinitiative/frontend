import { useState } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { DataTable } from '@/features/dashboard/DataTable'
import { getComputeEngineColumns, getDatabaseColumns } from '@/features/dashboard/columns'
import type { ServiceRow } from '@/features/dashboard/serviceCatalog'

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

  it('ensures all column header th elements have scope="col"', () => {
    render(<Harness data={makeRows(3)} />)
    const headers = screen.getAllByRole('columnheader')
    headers.forEach((th) => {
      expect(th.getAttribute('scope')).toBe('col')
    })
  })

  it('exposes service and column identifiers for responsive layouts', () => {
    const { container } = render(<Harness data={makeRows(1)} serviceId="Database" />)
    const table = container.querySelector('table')

    expect(table).toHaveAttribute('data-service', 'Database')
    expect(screen.getByRole('columnheader', { name: /Name/i })).toHaveClass('fci-col-name')
    expect(within(screen.getAllByRole('row')[1]).getByText('row-01').closest('td')).toHaveClass('fci-col-name')
  })

  it('shows ascending/descending indicators and dynamic aria-labels on the sorted column button', () => {
    render(<Harness data={makeRows(3)} />)
    const nameHeader = screen.getByRole('columnheader', { name: /Name/i })
    expect(nameHeader.getAttribute('aria-sort')).toBe('ascending')

    const sortBtn = screen.getByRole('button', { name: /Sort by Name, ascending/i })
    expect(sortBtn).toBeDefined()

    fireEvent.click(sortBtn)
    expect(screen.getByRole('columnheader', { name: /Name/i }).getAttribute('aria-sort')).toBe('descending')
    expect(screen.getByRole('button', { name: /Sort by Name, descending/i })).toBeDefined()
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

  it('is keyboard-operable: a focused row activates onRowClick on Enter and Space', () => {
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
    expect(bodyRows[0]).toHaveAttribute('tabindex', '0')

    bodyRows[0].focus()
    fireEvent.keyDown(bodyRows[0], { key: 'Enter' })
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick.mock.calls[0][0]).toMatchObject({ name: 'row-01' })

    fireEvent.keyDown(bodyRows[1], { key: ' ' })
    expect(onRowClick).toHaveBeenCalledTimes(2)
    expect(onRowClick.mock.calls[1][0]).toMatchObject({ name: 'row-02' })
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

  it('shows a provisioning warning in the Compute Engine list status', () => {
    const row: ServiceRow = {
      id: 'ce-failed',
      name: 'failed-engine',
      status: 'Pending',
      message: 'Failed to pull image: ImagePullBackOff',
      col3: 'Ubuntu 24.04 LTS',
      col4: '10.0.0.2',
      col5: '4 GB',
      col6: '2 vCPU',
      region: 'IST',
      zone: 'ist-1',
    }

    render(
      <DataTable
        data={[row]}
        columns={getComputeEngineColumns()}
        onRowClick={() => {}}
        selectedRowId={null}
      />,
    )

    expect(screen.getByLabelText(`Provisioning warning: ${row.message}`)).toHaveTextContent(row.message!)
  })

  it('renders vCPU in the Database service list', () => {
    const row: ServiceRow = {
      id: 'db-1',
      name: 'primary-db',
      status: 'Running',
      col3: 'postgres',
      col4: 'db.internal:5432',
      col5: '4 GB',
      col6: '100 GB',
      col7: '16.1',
      col8: '2 vCPU',
      region: 'IST',
      zone: 'ist-1',
    }

    render(
      <DataTable
        data={[row]}
        columns={getDatabaseColumns()}
        onRowClick={() => {}}
        selectedRowId={null}
      />,
    )

    expect(screen.getByRole('columnheader', { name: /vCPU/i })).toBeInTheDocument()
    expect(screen.getByText('2 vCPU')).toBeInTheDocument()
  })

  it('sizes every column as a percentage so content cannot widen the table', () => {
    const row: ServiceRow = {
      id: 'db-1',
      name: 'primary-db',
      status: 'Running',
      col3: 'postgres',
      col4: 'primary-db-rw.fci-cust-291babe5-e1be-4a41-889a-38a85395b7f8.svc.cluster.local:5432',
      col5: '4 GB',
      col6: '100 GB',
      col7: '17',
      col8: '2 vCPU',
      region: 'IST',
      zone: 'ist-1',
    }

    render(
      <DataTable
        data={[row]}
        columns={getDatabaseColumns()}
        onRowClick={() => {}}
        selectedRowId={null}
        renderActions={() => <button type="button">delete</button>}
      />,
    )

    const headers = screen.getAllByRole('columnheader')
    const widths = headers.map((header) => header.style.width)
    expect(widths.every((width) => width.endsWith('%'))).toBe(true)

    const total = widths.reduce((sum, width) => sum + Number.parseFloat(width), 0)
    expect(total).toBeCloseTo(100, 1)
  })

  it('carries the full cell text in title so a truncated value stays readable', () => {
    const endpoint = 'primary-db-rw.fci-cust-291babe5-e1be-4a41-889a-38a85395b7f8.svc.cluster.local:5432'
    const row: ServiceRow = {
      id: 'db-1',
      name: 'primary-db',
      status: 'Running',
      col3: 'postgres',
      col4: endpoint,
      col5: '4 GB',
      col6: '100 GB',
      col7: '17',
      col8: '2 vCPU',
      region: 'IST',
      zone: 'ist-1',
    }

    render(
      <DataTable
        data={[row]}
        columns={getDatabaseColumns()}
        onRowClick={() => {}}
        selectedRowId={null}
      />,
    )

    expect(screen.getByText(endpoint)).toHaveAttribute('title', endpoint)
  })
})
