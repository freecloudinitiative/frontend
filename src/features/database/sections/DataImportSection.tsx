import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataImportPanel } from '@/components/database/DataImportPanel'
import { MissingTableNotice } from '@/components/database/MissingTableNotice'
import { useDatabaseStore } from '@/features/database/store'
import { serviceResourcePath } from '@/features/dashboard/serviceRoutes'
import { useImportData } from '@/features/database/hooks'
import type { ImportOptions, ImportResult } from '@/features/database/types'
import { getApiErrorMessage } from '@/lib/apiError'
import type { FileFormat, FilePreview } from '@/utils/fileParser'
import { validateImportOptions } from '@/utils/fileValidator'

interface DataImportSectionProps {
  selectedDatabaseId: string | null
}

const DEFAULT_OPTIONS: ImportOptions = { mode: 'insert', hasHeaders: true, delimiter: ',' }
// tableName is carried on the entry rather than read back off importOptions:
// the form is cleared once an attempt completes, so by render time the options
// no longer say which table was asked for.
type ImportHistoryEntry = ImportResult & { format: FileFormat; tableName: string }

function importHistoryLabel(entry: ImportHistoryEntry): string {
  // The missing-table case gets its own panel with the suggested DDL, so the
  // history line only has to name it rather than carry Postgres's own wording.
  if (entry.missingTable) return '✗ Target table does not exist'
  if (!entry.success) return `✗ ${entry.errorMessage ?? 'Import failed'}`
  if (entry.format === 'sql') return '✓ SQL script imported'
  return `✓ ${entry.rowsImported ?? 0} rows imported`
}

export function DataImportSection({ selectedDatabaseId }: DataImportSectionProps) {
  const importData = useImportData()
  const navigate = useNavigate()
  const setSqlScript = useDatabaseStore((state) => state.setSqlScript)
  const getSqlScript = useDatabaseStore((state) => state.getSqlScript)

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
    const tableName = importOptions.tableName ?? ''

    importData.mutate(
      { databaseId: selectedDatabaseId, file: selectedFile, options: importOptions },
      {
        onSuccess: (data) => {
          setImportHistory((prev) => ({
            ...prev,
            [selectedDatabaseId]: [{ ...data, format, tableName }, ...(prev[selectedDatabaseId] ?? [])],
          }))
          // A failed attempt keeps the file and the options. The commonest
          // failure is a table that does not exist yet, and the customer's next
          // move is to create it and press Import again on the same file --
          // clearing the form would make them pick it a second time.
          if (data.success) reset()
        },
        onError: (error) => {
          const errorMessage = getApiErrorMessage(error, 'Import failed')
          setImportHistory((prev) => ({
            ...prev,
            [selectedDatabaseId]: [{ success: false, errorMessage, format, tableName }, ...(prev[selectedDatabaseId] ?? [])],
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
  // Only the newest attempt is actionable. An older missing-table result may
  // well have been resolved by the table being created since.
  const latest = currentHistory[0]
  const suggestedDdl = latest?.missingTable ? latest.suggestedDdl : undefined

  function openSuggestionInSqlEditor(ddl: string) {
    if (!selectedDatabaseId) return
    // Replacing whatever is in the editor is the one destructive thing this
    // panel can do, so it asks first -- the editor's own Clear button sets the
    // same precedent.
    const existing = getSqlScript(selectedDatabaseId)
    if (existing.trim() && !window.confirm('Replace the current SQL Editor script?')) return
    setSqlScript(selectedDatabaseId, ddl)
    navigate(serviceResourcePath('database', selectedDatabaseId, 'sql-editor'))
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

      {suggestedDdl && (
        <MissingTableNotice
          tableName={latest?.tableName ?? ''}
          ddl={suggestedDdl}
          onOpenInSqlEditor={() => openSuggestionInSqlEditor(suggestedDdl)}
        />
      )}

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
