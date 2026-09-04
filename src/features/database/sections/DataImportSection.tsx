import { useEffect, useState } from 'react'
import { DataImportPanel } from '@/components/database/DataImportPanel'
import { useImportData } from '@/features/database/hooks'
import type { ImportOptions, ImportResult } from '@/features/database/types'
import { getApiErrorMessage } from '@/lib/apiError'
import type { FileFormat, FilePreview } from '@/utils/fileParser'
import { validateImportOptions } from '@/utils/fileValidator'

interface DataImportSectionProps {
  selectedDatabaseId: string | null
}

const DEFAULT_OPTIONS: ImportOptions = { mode: 'insert', hasHeaders: true, delimiter: ',' }
type ImportHistoryEntry = ImportResult & { format: FileFormat }

function importHistoryLabel(entry: ImportHistoryEntry): string {
  if (!entry.success) return `✗ ${entry.errorMessage ?? 'Import failed'}`
  if (entry.format === 'sql') return '✓ SQL script imported'
  return `✓ ${entry.rowsImported ?? 0} rows imported`
}

export function DataImportSection({ selectedDatabaseId }: DataImportSectionProps) {
  const importData = useImportData()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const [importOptions, setImportOptions] = useState<ImportOptions>(DEFAULT_OPTIONS)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [importHistory, setImportHistory] = useState<Record<string, ImportHistoryEntry[]>>({})

  function reset() {
    setSelectedFile(null)
    setFilePreview(null)
    setImportOptions(DEFAULT_OPTIONS)
    setValidationError(null)
  }

  useEffect(() => {
    reset()
  }, [selectedDatabaseId])

  function handleImport() {
    if (!selectedDatabaseId || !selectedFile || !filePreview) return

    if (filePreview.error) {
      setValidationError(filePreview.error)
      return
    }

    const validation = validateImportOptions(importOptions, filePreview.format)
    if (!validation.valid) {
      setValidationError(validation.error ?? 'Invalid import options')
      return
    }
    setValidationError(null)
    const format = filePreview.format

    importData.mutate(
      { databaseId: selectedDatabaseId, file: selectedFile, options: importOptions },
      {
        onSuccess: (data) => {
          setImportHistory((prev) => ({
            ...prev,
            [selectedDatabaseId]: [{ ...data, format }, ...(prev[selectedDatabaseId] ?? [])],
          }))
          reset()
        },
        onError: (error) => {
          const errorMessage = getApiErrorMessage(error, 'Import failed')
          setImportHistory((prev) => ({
            ...prev,
            [selectedDatabaseId]: [{ success: false, errorMessage, format }, ...(prev[selectedDatabaseId] ?? [])],
          }))
        },
      },
    )
  }

  if (!selectedDatabaseId) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Data Import</div>
        <div style={{ color: 'var(--dash-text-dim)' }}>Select a database to import data</div>
      </div>
    )
  }

  const currentHistory = importHistory[selectedDatabaseId] ?? []

  return (
    <div>
      {validationError && (
        <div role="alert" style={{ color: '#e0546a', padding: '0 14px' }}>
          ⚠ {validationError}
        </div>
      )}
      <DataImportPanel
        selectedFile={selectedFile}
        filePreview={filePreview}
        importOptions={importOptions}
        isImporting={importData.isPending}
        onFileSelected={(file, preview) => {
          setSelectedFile(file)
          setFilePreview(preview)
          setValidationError(null)
        }}
        onValidationError={setValidationError}
        onOptionsChange={setImportOptions}
        onImport={handleImport}
        onCancel={reset}
      />

      <div className="fci-tab-content" style={{ marginTop: 4 }}>
        <div className="fci-section-title">Recent Imports</div>
        {currentHistory.length === 0 ? (
          <div style={{ color: 'var(--dash-text-dim)' }}>No imports yet</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {currentHistory.map((entry, index) => (
              <li key={index} style={{ color: entry.success ? '#7ec87e' : '#e0546a', marginBottom: 4 }}>
                {importHistoryLabel(entry)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
