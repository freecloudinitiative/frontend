import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DatabaseTabContent } from '@/features/dashboard/tabs/DatabaseTabContent'

const editorTracker = vi.hoisted(() => ({ renders: 0 }))

vi.mock('@/components/editor/SqlEditor', () => ({
  SqlEditor: () => {
    editorTracker.renders += 1
    return <div>Lazy Monaco editor</div>
  },
}))

vi.mock('@/features/database/hooks', () => ({
  useDatabases: () => ({ data: [{ id: 'db-1', name: 'test-db' }] }),
  useExecuteSql: () => ({
    isPending: false,
    variables: undefined,
    mutate: vi.fn(),
    reset: vi.fn(),
  }),
}))

describe('DatabaseTabContent — lazy SQL editor', () => {
  beforeEach(() => {
    editorTracker.renders = 0
  })

  it('renders another database tab without loading the Monaco component', () => {
    render(<DatabaseTabContent tab="logs" selectedDatabaseId="db-1" />)

    expect(screen.getByText('Recent Log Entries')).toBeInTheDocument()
    expect(editorTracker.renders).toBe(0)
  })

  it('shows a clear fallback, then renders the editor after its lazy module resolves', async () => {
    render(<DatabaseTabContent tab="sql-editor" selectedDatabaseId="db-1" />)

    expect(screen.getByText('[ LOADING EDITOR... ]')).toBeInTheDocument()
    expect(await screen.findByText('Lazy Monaco editor')).toBeInTheDocument()
    expect(editorTracker.renders).toBe(1)
  })
})
