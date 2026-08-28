import { useParams } from 'react-router-dom'
import { SqlEditorSection } from '@/features/database/sections/SqlEditorSection'
import './tui-dashboard.css'

export function StandaloneSqlEditorPage() {
  const { databaseId } = useParams<{ databaseId: string }>()

  return (
    <div className="fci-terminal-standalone">
      <SqlEditorSection selectedDatabaseId={databaseId ?? null} standalone />
    </div>
  )
}
