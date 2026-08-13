/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §5.4, §7.14
 *
 * This is the one place in the whole suite where the assertion intentionally checks for a
 * *changed* output versus pre-refactor: DataImportPanel previously did raw inline
 * `(selectedFile.size / 1024).toFixed(1)} KB` math (KB-only, no scaling). The DRY audit (4.3)
 * flagged this as a duplicate, less-capable formatBytes reimplementation and the approved fix
 * was to switch it to the shared `formatBytes` from lib/format.ts. This is an approved
 * behavior change, not a regression — see DRY_AUDIT_REPORT.md finding 4.3.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataImportPanel } from '@/components/database/DataImportPanel'
import { formatBytes } from '@/lib/format'
import type { FilePreview } from '@/utils/fileParser'
import type { ImportOptions } from '@/features/database/types'

const DEFAULT_OPTIONS: ImportOptions = {
  mode: 'insert',
  tableName: 'imported_table',
  hasHeaders: true,
  delimiter: ',',
}

const SAMPLE_PREVIEW: FilePreview = {
  format: 'csv',
  preview: 'a,b,c\n1,2,3',
  rowCount: 1,
}

/**
 * Builds a File with a tiny real backing buffer but a spoofed `.size`, so large-size scenarios
 * (MB/GB) don't actually allocate that many bytes in the test process.
 */
function makeFile(name: string, sizeBytes: number): File {
  const file = new File([new Uint8Array(1)], name, { type: 'text/csv' })
  Object.defineProperty(file, 'size', { value: sizeBytes, configurable: true })
  return file
}

function renderPanel(file: File) {
  render(
    <DataImportPanel
      selectedFile={file}
      filePreview={SAMPLE_PREVIEW}
      importOptions={DEFAULT_OPTIONS}
      isImporting={false}
      onFileSelected={() => {}}
      onValidationError={() => {}}
      onOptionsChange={() => {}}
      onImport={() => {}}
      onCancel={() => {}}
    />,
  )
}

describe('DataImportPanel — file size display', () => {
  it('displays file size using the shared formatBytes, not raw KB math', () => {
    const file = makeFile('small.csv', 2048) // exactly 2 KB
    renderPanel(file)
    expect(screen.getByText(new RegExp(formatBytes(2048).replace('.', '\\.')))).toBeInTheDocument()
    // The old inline expression would have produced "2.0 KB" too for exactly 2048 bytes —
    // the real behavior change is visible at MB/GB scale, asserted below.
  })

  it('a >1MB file now shows MB (not a large raw KB number) — confirms the approved fix landed', () => {
    const oneAndHalfMB = 1.5 * 1024 * 1024
    const file = makeFile('large.csv', oneAndHalfMB)
    renderPanel(file)

    // Approved new behavior: scales to MB.
    expect(screen.getByText(/1\.5 MB/)).toBeInTheDocument()

    // Regression guard: must NOT show the old KB-only math's output for this size
    // ((1.5 * 1024 * 1024) / 1024).toFixed(1) === "1536.0"
    expect(screen.queryByText(/1536\.0 KB/)).not.toBeInTheDocument()
  })

  it('matches Storage\'s existing formatBytes output exactly for the same byte count (no divergent formatting)', () => {
    const fiveGB = 5 * 1024 ** 3
    const file = makeFile('huge.csv', fiveGB)
    renderPanel(file)
    expect(screen.getByText(new RegExp(formatBytes(fiveGB).replace('.', '\\.')))).toBeInTheDocument()
  })
})
