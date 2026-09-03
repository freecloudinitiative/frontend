import type { ImportMode, ImportOptions } from '@/features/database/types'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['csv', 'json', 'sql']
const VALID_MODES: ImportMode[] = ['insert', 'upsert', 'replace']

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateFile(file: File): ValidationResult {
  if (!file.name) {
    return { valid: false, error: 'File name is empty' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Unsupported file type — expected .csv, .json, or .sql' }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds 10MB limit' }
  }

  return { valid: true }
}

export function validateImportOptions(options: ImportOptions, format: string): ValidationResult {
  if (format === 'sql') return { valid: true }

  if (!VALID_MODES.includes(options.mode)) {
    return { valid: false, error: 'Invalid import mode' }
  }

  if (format === 'csv' && options.delimiter !== undefined && options.delimiter.length !== 1) {
    return { valid: false, error: 'Delimiter must be a single character' }
  }

  return { valid: true }
}
