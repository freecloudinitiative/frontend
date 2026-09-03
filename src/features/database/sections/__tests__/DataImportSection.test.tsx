import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ImportResult } from '@/features/database/types'
import type { FileFormat, FilePreview } from '@/utils/fileParser'
import { DataImportSection } from '../DataImportSection'

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
    render(<DataImportSection selectedDatabaseId="db-1" />)

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
    render(<DataImportSection selectedDatabaseId="db-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Select CSV' }))
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    act(() => callbacks().onSuccess({ success: true, rowsImported: 12 }))

    expect(screen.getByText('✓ 12 rows imported')).toBeInTheDocument()
  })

  it('records transport errors with the selected file format', () => {
    render(<DataImportSection selectedDatabaseId="db-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Select SQL' }))
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    act(() => callbacks().onError(new Error('network down')))

    expect(screen.getByText('✗ network down')).toBeInTheDocument()
  })
})
