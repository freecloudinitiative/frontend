import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { StandaloneSqlEditorPage } from '@/pages/StandaloneSqlEditorPage'

vi.mock('@/features/database/sections/SqlEditorSection', () => ({
  SqlEditorSection: ({ selectedDatabaseId, standalone }: { selectedDatabaseId: string | null; standalone?: boolean }) => (
    <div>
      Database: {selectedDatabaseId}; standalone: {String(standalone)}
    </div>
  ),
}))

describe('StandaloneSqlEditorPage', () => {
  it('restores the selected database from the standalone route', () => {
    render(
      <MemoryRouter initialEntries={['/sql-editor/db%2Fprimary']}>
        <Routes>
          <Route path="/sql-editor/:databaseId" element={<StandaloneSqlEditorPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Database: db/primary; standalone: true')).toBeInTheDocument()
  })
})
