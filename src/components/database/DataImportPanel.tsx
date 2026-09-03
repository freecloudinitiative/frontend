import { useRef, useState } from 'react'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import type { ImportMode, ImportOptions } from '@/features/database/types'
import type { FilePreview } from '@/utils/fileParser'
import { parseFilePreview } from '@/utils/fileParser'
import { validateFile } from '@/utils/fileValidator'
import { formatBytes } from '@/lib/format'

const DELIMITER_OPTIONS = [
  { value: ',', label: ',' },
  { value: ';', label: ';' },
  { value: '\t', label: '\\t' },
  { value: '|', label: '|' },
]

const MODE_OPTIONS = [
  { value: 'insert', label: 'Insert' },
  { value: 'upsert', label: 'Upsert' },
  { value: 'replace', label: 'Replace' },
]

interface DataImportPanelProps {
  selectedFile: File | null
  filePreview: FilePreview | null
  importOptions: ImportOptions
  isImporting: boolean
  onFileSelected: (file: File, preview: FilePreview) => void
  onValidationError: (message: string) => void
  onOptionsChange: (options: ImportOptions) => void
  onImport: () => void
  onCancel: () => void
}

function defaultTableName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '')
}

export function DataImportPanel({
  selectedFile,
  filePreview,
  importOptions,
  isImporting,
  onFileSelected,
  onValidationError,
  onOptionsChange,
  onImport,
  onCancel,
}: DataImportPanelProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const validation = validateFile(file)
    if (!validation.valid) {
      onValidationError(validation.error ?? 'Invalid file')
      return
    }
    const preview = await parseFilePreview(file)
    if (preview.format === 'sql') {
      onOptionsChange({ ...importOptions, tableName: undefined })
    } else if (!importOptions.tableName) {
      onOptionsChange({ ...importOptions, tableName: defaultTableName(file.name) })
    }
    onFileSelected(file, preview)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragActive(false)
    const file = event.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') onCancel()
  }

  return (
    <div className="fci-tab-content" onKeyDown={handleKeyDown}>
      <div className="fci-section-title">Import Data</div>
      <div
        className={`fci-dropzone${isDragActive ? ' fci-dropzone--active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop a CSV, JSON, or SQL file, or click to select one"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragActive(true)
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
      >
        Drag & drop CSV/JSON/SQL files here, or click to select
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.sql"
        style={{ display: 'none' }}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
          event.target.value = ''
        }}
      />

      {selectedFile && filePreview && (
        <div style={{ marginTop: 14 }}>
          <div className="fci-section-title">
            {selectedFile.name} — {formatBytes(selectedFile.size)}
          </div>

          {filePreview.error ? (
            <div role="alert" style={{ color: '#e0546a' }}>⚠ {filePreview.error}</div>
          ) : filePreview.format === 'csv' && Array.isArray(filePreview.preview) ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="fci-table">
                <thead>
                  <tr>
                    {Object.keys(filePreview.preview[0] ?? {}).map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filePreview.preview.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex}>{String(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filePreview.format === 'json' && Array.isArray(filePreview.preview) ? (
            <pre className="fci-console-log">{JSON.stringify(filePreview.preview, null, 2)}</pre>
          ) : (
            <pre className="fci-console-log">{String(filePreview.preview)}</pre>
          )}

          {filePreview.format === 'sql' ? (
            <div role="note" style={{ color: 'var(--dash-text-dim)', marginTop: 14 }}>
              SQL scripts run atomically. Transaction commands, psql meta-commands, and COPY FROM STDIN are not supported.
            </div>
          ) : (
            <div className="fci-split-fields" style={{ marginTop: 14 }}>
              <div className="fci-fieldbox">
                <label htmlFor="import-table-name" className="fci-box-label">Table Name</label>
                <TerminalInput
                  id="import-table-name"
                  type="text"
                  value={importOptions.tableName ?? ''}
                  onChange={(event) => onOptionsChange({ ...importOptions, tableName: event.target.value })}
                />
              </div>

              {filePreview.format === 'csv' && (
                <div className="fci-fieldrow">
                  <TerminalSelect
                    id="import-delimiter"
                    label="Delimiter"
                    value={importOptions.delimiter ?? ','}
                    options={DELIMITER_OPTIONS}
                    onChange={(value) => onOptionsChange({ ...importOptions, delimiter: value })}
                  />
                  <label className="fci-fieldbox">
                    <input
                      type="checkbox"
                      checked={importOptions.hasHeaders ?? true}
                      onChange={(event) => onOptionsChange({ ...importOptions, hasHeaders: event.target.checked })}
                      aria-label="Has headers"
                    />
                    {' '}Has headers
                  </label>
                </div>
              )}

              <TerminalSelect
                id="import-mode"
                label="Mode"
                value={importOptions.mode}
                options={MODE_OPTIONS}
                onChange={(value) => onOptionsChange({ ...importOptions, mode: value as ImportMode })}
              />
            </div>
          )}

          <div className="fci-sql-actions" style={{ marginTop: 14 }}>
            <button
              type="button"
              className="fci-linkbtn fci-action-add"
              disabled={isImporting}
              onClick={onImport}
              aria-label="Import file"
            >
              {isImporting ? 'Importing…' : 'Import'}
            </button>
            <button
              type="button"
              className="fci-linkbtn fci-action-back"
              disabled={isImporting}
              onClick={onCancel}
              aria-label="Cancel import"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
