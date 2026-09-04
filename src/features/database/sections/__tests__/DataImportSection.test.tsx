import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ImportResult } from '@/features/database/types'
import type { FileFormat, FilePreview } from '@/utils/fileParser'
import { DataImportSection } from '../DataImportSection'
import { useDatabaseStore } from '@/features/database/store'

// The section navigates to the SQL Editor when it offers a table to create, so
// it needs a router here just as it has one in the app.
function renderSection(databaseId = 'db-1') {
  return render(
    <MemoryRouter>
      <DataImportSection selectedDatabaseId={databaseId} />
    </MemoryRouter>,
  )
}

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }))

vi.mock('@/features/database/hooks', () => ({
  useImportData: () => ({ mutate, isPending: false }),
}))

interface MockPanelProps {
  onFileSelected: (file: File, preview: FilePreview) => void
  onImport: () => void
}

vi.mock('@/components/database/DataImportPanel', () => ({
  DataImportPanel: ({ onFileSelected, onImport }: MockPanelProps) => {
    const select = (format: FileFormat) => {
      const name = format === 'sql' ? 'schema.sql' : 'users.csv'
      const preview: FilePreview = format === 'sql'
        ? { format, preview: 'CREATE TABLE users (id bigint);' }
        : { format, preview: [{ id: '1' }], rowCount: 1 }
      onFileSelected(new File(['content'], name), preview)
    }

    return (
      <div>
        <button type="button" onClick={() => select('sql')}>Select SQL</button>
        <button type="button" onClick={() => select('csv')}>Select CSV</button>
        <button type="button" onClick={onImport}>Import</button>
      </div>
    )
  },
}))

interface MutationCallbacks {
  onSuccess: (result: ImportResult) => void
  onError: (error: Error) => void
}

function callbacks(): MutationCallbacks {
  return mutate.mock.calls[0][1] as MutationCallbacks
}

describe('DataImportSection import history', () => {
  beforeEach(() => mutate.mockReset())

  it('imports SQL without row options and shows a SQL-specific success', () => {
    renderSection()

    fireEvent.click(screen.getByRole('button', { name: 'Select SQL' }))
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ databaseId: 'db-1' }),
      expect.any(Object),
    )
    act(() => callbacks().onSuccess({ success: true }))

    expect(screen.getByText('✓ SQL script imported')).toBeInTheDocument()
  })

  it('keeps row counts for CSV imports', () => {
    renderSection()

    fireEvent.click(screen.getByRole('button', { name: 'Select CSV' }))
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    act(() => callbacks().onSuccess({ success: true, rowsImported: 12 }))

    expect(screen.getByText('✓ 12 rows imported')).toBeInTheDocument()
  })

  it('records transport errors with the selected file format', () => {
    renderSection()

    fireEvent.click(screen.getByRole('button', { name: 'Select SQL' }))
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    act(() => callbacks().onError(new Error('network down')))

    expect(screen.getByText('✗ network down')).toBeInTheDocument()
  })
})

const SUGGESTED_DDL = 'CREATE TABLE "users" (\n  "id" integer PRIMARY KEY\n);'

// The statement is rendered inside <pre><code>, and getByText collapses
// whitespace -- which would make a multi-line statement unmatchable. Read it
// off the element instead so the newlines are part of the assertion.
function suggestedDdlText(): string | null {
  const notice = screen.queryByRole('region', { name: 'Missing table' })
  // <pre>, not <code>: the prose above also wraps the table name in a <code>.
  return notice?.querySelector('pre')?.textContent ?? null
}

function importCsvThenMissingTable() {
  renderSection()
  fireEvent.click(screen.getByRole('button', { name: 'Select CSV' }))
  fireEvent.click(screen.getByRole('button', { name: 'Import' }))
  act(() =>
    callbacks().onSuccess({
      success: false,
      missingTable: true,
      errorMessage: 'table "users" does not exist',
      suggestedDdl: SUGGESTED_DDL,
    }),
  )
}

describe('DataImportSection missing target table', () => {
  beforeEach(() => {
    mutate.mockReset()
    useDatabaseStore.setState({ scripts: {} })
  })

  it('offers the suggested table instead of printing the raw Postgres error', () => {
    importCsvThenMissingTable()

    expect(suggestedDdlText()).toBe(SUGGESTED_DDL)
    expect(screen.getByRole('button', { name: 'Open in SQL Editor' })).toBeInTheDocument()
    // Postgres's own wording is what sent the customer looking for help.
    expect(screen.queryByText(/relation .* does not exist/)).not.toBeInTheDocument()
    expect(screen.getByText('✗ Target table does not exist')).toBeInTheDocument()
  })

  it('loads the statement into the SQL Editor for that database', () => {
    importCsvThenMissingTable()

    fireEvent.click(screen.getByRole('button', { name: 'Open in SQL Editor' }))

    expect(useDatabaseStore.getState().getSqlScript('db-1')).toBe(SUGGESTED_DDL)
  })

  // Replacing a script the customer is part-way through writing is the one
  // destructive thing this panel can do.
  it('asks before overwriting an existing script, and leaves it alone on refusal', () => {
    useDatabaseStore.getState().setSqlScript('db-1', 'SELECT 1;')
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    importCsvThenMissingTable()

    fireEvent.click(screen.getByRole('button', { name: 'Open in SQL Editor' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(useDatabaseStore.getState().getSqlScript('db-1')).toBe('SELECT 1;')
    confirmSpy.mockRestore()
  })

  // A successful import clears the form; a failed one must not, or the customer
  // has to pick the same file again after creating the table.
  it('keeps the chosen file after a failure so Import can be retried', () => {
    importCsvThenMissingTable()

    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    expect(mutate).toHaveBeenCalledTimes(2)
  })

  it('drops the suggestion once a later attempt succeeds', () => {
    importCsvThenMissingTable()

    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    act(() => (mutate.mock.calls[1][1] as MutationCallbacks).onSuccess({ success: true, rowsImported: 5 }))

    expect(suggestedDdlText()).toBeNull()
    expect(screen.getByText('✓ 5 rows imported')).toBeInTheDocument()
  })
})
