/**
 * DataTable — automated axe-core accessibility tests (PR #37)
 *
 * Renders the DataTable with sample data and asserts zero critical/serious
 * axe violations on the rendered markup in default, sorted, and filtered states.
 */
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
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

const SAMPLE_DATA: Row[] = [
  { id: 'id-1', name: 'web-server-01', status: 'running' },
  { id: 'id-2', name: 'api-worker-02', status: 'stopped' },
  { id: 'id-3', name: 'cache-node-03', status: 'running' },
]

function Harness({ data, initialFilter = '' }: { data: Row[]; initialFilter?: string }) {
  const [globalFilter, setGlobalFilter] = useState(initialFilter)
  return (
    <DataTable
      data={data}
      columns={columns}
      onRowClick={() => {}}
      selectedRowId={null}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      renderActions={(row) => (
        <button type="button" aria-label={`Delete ${row.name}`}>✕</button>
      )}
    />
  )
}

describe('DataTable — axe a11y audit', () => {
  it('has zero critical/serious axe violations in default state', async () => {
    const { container } = render(<Harness data={SAMPLE_DATA} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has zero critical/serious axe violations in sorted state', async () => {
    const { container } = render(<Harness data={SAMPLE_DATA} />)
    const sortBtn = screen.getByRole('button', { name: /Sort by Name/i })
    fireEvent.click(sortBtn)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has zero critical/serious axe violations in filtered state', async () => {
    const { container } = render(<Harness data={SAMPLE_DATA} initialFilter="web" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has zero critical/serious axe violations in empty state', async () => {
    const { container } = render(<Harness data={[]} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has zero critical/serious axe violations in loading state', async () => {
    const { container } = render(
      <DataTable
        data={[]}
        columns={columns}
        onRowClick={() => {}}
        selectedRowId={null}
        globalFilter=""
        onGlobalFilterChange={() => {}}
        isLoading
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
