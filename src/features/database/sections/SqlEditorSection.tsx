import { useCallback, useEffect, useRef, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { SqlEditor } from '@/components/editor/SqlEditor'
import { QueryResultPanel } from '@/components/database/QueryResultPanel'
import { useDatabases, useExecuteSql } from '@/features/database/hooks'
import { useDatabaseStore } from '@/features/database/store'
import type { SqlExecutionResult } from '@/features/database/types'

interface SqlEditorSectionProps {
  selectedDatabaseId: string | null
}

interface ScopedQueryResult {
  databaseId: string
  status: 'idle' | 'loading' | 'error' | 'success'
  result: SqlExecutionResult | null
}

export function SqlEditorSection({ selectedDatabaseId }: SqlEditorSectionProps) {
  const { data: databases } = useDatabases()
  const database = databases?.find((db) => db.id === selectedDatabaseId)
  const executeSql = useExecuteSql()

  const sqlScript = useDatabaseStore((state) => state.getSqlScript(selectedDatabaseId))
  const setSqlScriptInStore = useDatabaseStore((state) => state.setSqlScript)
  const scriptRef = useRef({ databaseId: selectedDatabaseId, script: sqlScript })
  const [queryResults, setQueryResults] = useState<Record<string, ScopedQueryResult>>({})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [splitOrientation, setSplitOrientation] = useState<'vertical' | 'horizontal'>('vertical')

  useEffect(() => {
    scriptRef.current = { databaseId: selectedDatabaseId, script: sqlScript }
  }, [selectedDatabaseId, sqlScript])

  const resetMutation = executeSql.reset
  useEffect(() => {
    resetMutation()
  }, [selectedDatabaseId, resetMutation])

  useEffect(() => {
    if (!isFullscreen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  function handleScriptChange(value: string) {
    if (selectedDatabaseId) {
      setSqlScriptInStore(selectedDatabaseId, value)
    }
  }

  const runQuery = useCallback(() => {
    if (!selectedDatabaseId || executeSql.isPending) return
    const scriptToExecute =
      scriptRef.current.databaseId === selectedDatabaseId
        ? scriptRef.current.script
        : sqlScript

    if (!scriptToExecute.trim()) return
    const targetDbId = selectedDatabaseId

    setQueryResults((prev) => ({
      ...prev,
      [targetDbId]: { databaseId: targetDbId, status: 'loading', result: null },
    }))

    executeSql.mutate(
      { databaseId: targetDbId, script: scriptToExecute },
      {
        onSuccess: (data, variables) => {
          setQueryResults((prev) => ({
            ...prev,
            [variables.databaseId]: {
              databaseId: variables.databaseId,
              status: data.success ? 'success' : 'error',
              result: data,
            },
          }))
        },
        onError: (error, variables) => {
          const errorMessage =
            (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            error?.message ??
            'Query failed'
          setQueryResults((prev) => ({
            ...prev,
            [variables.databaseId]: {
              databaseId: variables.databaseId,
              status: 'error',
              result: {
                success: false,
                errorMessage,
                executedAt: new Date().toISOString(),
              },
            },
          }))
        },
      },
    )
  }, [selectedDatabaseId, sqlScript, executeSql])

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

  async function handleFormat() {
    try {
      const { format: formatSql } = await import('sql-formatter')
      handleScriptChange(formatSql(sqlScript, { language: 'postgresql' }))
    } catch {
      // leave script unchanged if it can't be formatted
    }
  }

  function openInNewTab() {
    const url = `/services/database/sql-editor`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!selectedDatabaseId) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">SQL Editor</div>
        <div style={{ color: 'var(--dash-text-dim)' }}>Select a database to open the SQL editor</div>
      </div>
    )
  }

  const activeResult = selectedDatabaseId ? queryResults[selectedDatabaseId] : null
  const isExecutingCurrentDb = executeSql.isPending && executeSql.variables?.databaseId === selectedDatabaseId

  const status: 'idle' | 'loading' | 'error' | 'success' = isExecutingCurrentDb
    ? 'loading'
    : activeResult && activeResult.databaseId === selectedDatabaseId
      ? activeResult.status
      : 'idle'

  const result: SqlExecutionResult | null =
    !isExecutingCurrentDb && activeResult && activeResult.databaseId === selectedDatabaseId
      ? activeResult.result
      : null

  const content = (
    <>
      <div className="fci-terminal-header" style={{ marginBottom: 10 }}>
        <div className="fci-section-title" style={{ position: 'static' }}>
          SQL Editor — {database?.name ?? selectedDatabaseId}
        </div>
        <div className="fci-terminal-actions">
          {isFullscreen && (
            <button
              type="button"
              className="fci-terminal-btn"
              title={splitOrientation === 'vertical' ? 'Switch to side-by-side split' : 'Switch to top-bottom split'}
              onClick={() => setSplitOrientation((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'))}
              aria-label={splitOrientation === 'vertical' ? 'Switch to side-by-side split' : 'Switch to top-bottom split'}
            >
              {splitOrientation === 'vertical' ? '◧' : '⬒'}
            </button>
          )}
          <button
            type="button"
            className="fci-terminal-btn"
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            onClick={() => setIsFullscreen((value) => !value)}
            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? '⤦' : '⛶'}
          </button>
          <button
            type="button"
            className="fci-terminal-btn"
            title="Open in new tab"
            onClick={openInNewTab}
            aria-label="Open in new tab"
          >
            ↗
          </button>
        </div>
      </div>

      <div className="fci-sql-actions">
        <button
          type="button"
          className="fci-linkbtn fci-action-add"
          disabled={executeSql.isPending}
          onClick={runQuery}
          aria-label="Execute SQL script"
        >
          {executeSql.isPending ? 'Executing…' : 'Execute (⌘/Ctrl+Enter)'}
        </button>
        <button type="button" className="fci-linkbtn fci-action-back" onClick={handleClear} aria-label="Clear script">
          Clear
        </button>
        <button type="button" className="fci-linkbtn fci-action-edit" onClick={handleFormat} aria-label="Format script">
          Format
        </button>
      </div>

      <div role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        {executeSql.isPending && 'Executing SQL'}
        {status === 'success' && 'Query executed successfully'}
        {status === 'error' && `Query failed: ${result?.errorMessage ?? ''}`}
      </div>

      <Group
        orientation={isFullscreen ? splitOrientation : 'vertical'}
        style={{
          height: isFullscreen ? 'calc(100vh - 120px)' : 480,
          marginTop: 10,
          flex: isFullscreen ? '1 1 auto' : undefined,
          width: '100%',
        }}
      >
        <Panel defaultSize={50} minSize={15}>
          <SqlEditor value={sqlScript} onChange={handleScriptChange} height="100%" isLoading={executeSql.isPending} />
        </Panel>
        <Separator
          className={`fci-resize-handle${!isFullscreen ? ' fci-resize-disabled' : ''}`}
          disabled={!isFullscreen}
        />
        <Panel defaultSize={50} minSize={15}>
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <QueryResultPanel status={status} result={result} />
          </div>
        </Panel>
      </Group>
    </>
  )

  if (isFullscreen) {
    return <div className="fci-terminal-fullscreen">{content}</div>
  }

  return <div className="fci-tab-content">{content}</div>
}
