import { useState } from 'react'
import { DataImportPanel } from '@/components/database/DataImportPanel'
import { useImportData } from '@/features/database/hooks'
import type { ImportOptions, ImportResult } from '@/features/database/types'
import type { FilePreview } from '@/utils/fileParser'
import { validateImportOptions } from '@/utils/fileValidator'

interface DataImportSectionProps {
  selectedDatabaseId: string | null
}

const DEFAULT_OPTIONS: ImportOptions = { mode: 'insert', hasHeaders: true, delimiter: ',' }

export function DataImportSection({ selectedDatabaseId }: DataImportSectionProps) {
  const importData = useImportData()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const [importOptions, setImportOptions] = useState<ImportOptions>(DEFAULT_OPTIONS)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [importHistory, setImportHistory] = useState<ImportResult[]>([])

  function reset() {
    setSelectedFile(null)
    setFilePreview(null)
    setImportOptions(DEFAULT_OPTIONS)
    setValidationError(null)
  }

  function handleImport() {
    if (!selectedDatabaseId || !selectedFile || !filePreview) return

    const validation = validateImportOptions(importOptions, filePreview.format)
    if (!validation.valid) {
      setValidationError(validation.error ?? 'Invalid import options')
      return
    }
    setValidationError(null)

    importData.mutate(
      { databaseId: selectedDatabaseId, file: selectedFile, options: importOptions },
      {
        onSuccess: (data) => {
          setImportHistory((prev) => [data, ...prev])
          reset()
        },
        onError: (error) => {
          const errorMessage =
            (error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Import failed'
          setImportHistory((prev) => [{ success: false, errorMessage }, ...prev])
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
        {importHistory.length === 0 ? (
          <div style={{ color: 'var(--dash-text-dim)' }}>No imports yet</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {importHistory.map((entry, index) => (
              <li key={index} style={{ color: entry.success ? '#7ec87e' : '#e0546a', marginBottom: 4 }}>
                {entry.success ? `✓ ${entry.rowsImported} rows imported` : `✗ ${entry.errorMessage ?? 'Import failed'}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
