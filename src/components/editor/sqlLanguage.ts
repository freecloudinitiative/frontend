export type SqlEditorLanguage = 'pgsql' | 'mysql' | 'sql'

/** Select the smallest registered Monaco grammar for the database dialect. */
export function sqlEditorLanguageForEngine(engine: string | undefined): SqlEditorLanguage {
  if (engine === 'postgres') return 'pgsql'
  if (engine === 'mysql') return 'mysql'
  return 'sql'
}
