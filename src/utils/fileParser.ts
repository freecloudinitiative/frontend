import { validateFile } from '@/utils/fileValidator'

export type FileFormat = 'csv' | 'json' | 'sql'

export interface FilePreview {
  format: FileFormat
  preview: string | Record<string, unknown>[]
  rowCount?: number
  error?: string
}

const PREVIEW_BYTES = 5000
const PREVIEW_ROWS = 5

function detectFormat(fileName: string): FileFormat {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'json') return 'json'
  if (ext === 'sql') return 'sql'
  return 'csv'
}

function parseCsvPreview(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0)
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map((header) => header.trim())
  return lines.slice(1, 1 + PREVIEW_ROWS).map((line) => {
    const cells = line.split(',')
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = (cells[index] ?? '').trim()
      return row
    }, {})
  })
}

export async function parseFilePreview(file: File): Promise<FilePreview> {
  const format = detectFormat(file.name)
  const validation = validateFile(file)
  if (!validation.valid) {
    return {
      format,
      preview: format === 'csv' || format === 'json' ? [] : '',
      error: validation.error,
    }
  }

  try {
    if (format === 'json') {
      const fullText = await file.text()
      const parsed = JSON.parse(fullText) as unknown
      const items = Array.isArray(parsed) ? parsed : [parsed]
      return {
        format,
        preview: items.slice(0, PREVIEW_ROWS) as Record<string, unknown>[],
        rowCount: items.length,
      }
    }

    const text = await file.slice(0, PREVIEW_BYTES).text()

    if (format === 'sql') {
      return { format, preview: text }
    }

    const rows = parseCsvPreview(text)
    return { format, preview: rows, rowCount: rows.length }
  } catch (error) {
    return {
      format,
      preview: format === 'csv' || format === 'json' ? [] : '',
      error: error instanceof Error ? error.message : 'Failed to parse file',
    }
  }
}
