import { describe, expect, it } from 'vitest'
import { sqlEditorLanguageForEngine } from '@/components/editor/sqlLanguage'

describe('sqlEditorLanguageForEngine', () => {
  it.each([
    ['postgres', 'pgsql'],
    ['mysql', 'mysql'],
    ['sqlite', 'sql'],
  ])('maps %s to the matching bundled Monaco grammar', (engine, expected) => {
    expect(sqlEditorLanguageForEngine(engine)).toBe(expected)
  })

  it('uses the generic SQL grammar for unsupported database engines', () => {
    expect(sqlEditorLanguageForEngine('redis')).toBe('sql')
  })
})
