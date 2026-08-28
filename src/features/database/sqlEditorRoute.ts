export function getStandaloneSqlEditorUrl(databaseId: string): string {
  return `/sql-editor/${encodeURIComponent(databaseId)}`
}
