import { describe, expect, it } from 'vitest'
import { getStandaloneSqlEditorUrl } from '@/features/database/sqlEditorRoute'

describe('getStandaloneSqlEditorUrl', () => {
  it('preserves the selected database in an encoded standalone route', () => {
    expect(getStandaloneSqlEditorUrl('db/primary')).toBe('/sql-editor/db%2Fprimary')
  })
})
