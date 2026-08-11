import { useCallback, useEffect, useRef, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { format as formatSql } from 'sql-formatter'
import { SqlEditor } from '@/components/editor/SqlEditor'
import { QueryResultPanel } from '@/components/database/QueryResultPanel'
import { useDatabases, useExecuteSql } from '@/features/database/hooks'
import type { SqlExecutionResult } from '@/features/database/types'

interface SqlEditorSectionProps {
  selectedDatabaseId: string | null
}

function storageKey(databaseId: string) {
  return `database_${databaseId}_sql`
}

export function SqlEditorSection({ selectedDatabaseId }: SqlEditorSectionProps) {
  const { data: databases } = useDatabases()
  const database = databases?.find((db) => db.id === selectedDatabaseId)
  const executeSql = useExecuteSql()

  const [sqlScript, setSqlScript] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [result, setResult] = useState<SqlExecutionResult | null>(null)
  const scriptRef = useRef(sqlScript)
  scriptRef.current = sqlScript

  useEffect(() => {
    if (!selectedDatabaseId) return
    setSqlScript(localStorage.getItem(storageKey(selectedDatabaseId)) ?? '')
    setStatus('idle')
    setResult(null)
  }, [selectedDatabaseId])

  function handleScriptChange(value: string) {
    setSqlScript(value)
    if (selectedDatabaseId) localStorage.setItem(storageKey(selectedDatabaseId), value)
  }

  const runQuery = useCallback(() => {
    if (!selectedDatabaseId || !scriptRef.current.trim() || status === 'loading') return
    setStatus('loading')
    executeSql.mutate(
      { databaseId: selectedDatabaseId, script: scriptRef.current },
      {
        onSuccess: (data) => {
          setResult(data)
          setStatus(data.success ? 'success' : 'error')
        },
        onError: (error) => {
          const errorMessage =
            (error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Query failed'
          setResult({ success: false, errorMessage, executedAt: new Date().toISOString() })
          setStatus('error')
        },
      },
    )
  }, [selectedDatabaseId, status, executeSql])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        runQuery()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [runQuery])

  function handleClear() {
    if (sqlScript.trim() && !window.confirm('Clear the current script?')) return
    handleScriptChange('')
  }

  function handleFormat() {
    try {
      handleScriptChange(formatSql(sqlScript, { language: 'postgresql' }))
    } catch {
      // leave script unchanged if it can't be formatted
    }
  }

  if (!selectedDatabaseId) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">SQL Editor</div>
        <div style={{ color: 'var(--dash-text-dim)' }}>Select a database to open the SQL editor</div>
      </div>
    )
  }

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">SQL Editor — {database?.name ?? selectedDatabaseId}</div>
      <div className="fci-sql-actions">
        <button
          type="button"
          className="fci-linkbtn fci-action-add"
          disabled={status === 'loading'}
          onClick={runQuery}
          aria-label="Execute SQL script"
        >
          {status === 'loading' ? 'Executing…' : 'Execute (⌘/Ctrl+Enter)'}
        </button>
        <button type="button" className="fci-linkbtn fci-action-back" onClick={handleClear} aria-label="Clear script">
          Clear
        </button>
        <button type="button" className="fci-linkbtn fci-action-edit" onClick={handleFormat} aria-label="Format script">
          Format
        </button>
      </div>

      <div role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        {status === 'loading' && 'Executing SQL'}
        {status === 'success' && 'Query executed successfully'}
        {status === 'error' && `Query failed: ${result?.errorMessage ?? ''}`}
      </div>

      <Group orientation="vertical" style={{ height: 480, marginTop: 10 }}>
        <Panel defaultSize="60" minSize="20">
          <SqlEditor value={sqlScript} onChange={handleScriptChange} height="100%" isLoading={status === 'loading'} />
        </Panel>
        <Separator className="fci-resize-handle" />
        <Panel defaultSize="40" minSize="15">
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <QueryResultPanel status={status} result={result} />
          </div>
        </Panel>
      </Group>
    </div>
  )
}
