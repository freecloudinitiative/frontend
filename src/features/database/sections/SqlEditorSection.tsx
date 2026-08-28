import { useCallback, useEffect, useRef, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { LazySqlEditor } from '@/components/editor/LazySqlEditor'
import { sqlEditorLanguageForEngine } from '@/components/editor/sqlLanguage'
import { QueryResultPanel } from '@/components/database/QueryResultPanel'
import { useDatabases, useExecuteSql } from '@/features/database/hooks'
import { getStandaloneSqlEditorUrl } from '@/features/database/sqlEditorRoute'
import { useDatabaseStore } from '@/features/database/store'
import type { SqlExecutionResult } from '@/features/database/types'
import { getApiErrorMessage } from '@/lib/apiError'

interface SqlEditorSectionProps {
  readonly selectedDatabaseId: string | null
  readonly standalone?: boolean
}

interface ScopedQueryResult {
  readonly databaseId: string
  readonly status: 'idle' | 'loading' | 'error' | 'success'
  readonly result: SqlExecutionResult | null
}

interface QueryPresentation {
  readonly status: ScopedQueryResult['status']
  readonly result: SqlExecutionResult | null
}

interface SqlEditorHeaderProps {
  readonly databaseName: string
  readonly isFullscreen: boolean
  readonly splitOrientation: 'vertical' | 'horizontal'
  readonly onToggleFullscreen: () => void
  readonly onToggleSplit: () => void
  readonly onOpenInNewTab?: () => void
}

function getQueryPresentation(
  activeResult: ScopedQueryResult | undefined,
  isExecutingCurrentDatabase: boolean,
): QueryPresentation {
  if (isExecutingCurrentDatabase) return { status: 'loading', result: null }
  if (!activeResult) return { status: 'idle', result: null }
  return { status: activeResult.status, result: activeResult.result }
}

function SqlEditorHeader({
  databaseName,
  isFullscreen,
  splitOrientation,
  onToggleFullscreen,
  onToggleSplit,
  onOpenInNewTab,
}: Readonly<SqlEditorHeaderProps>) {
  const splitLabel = splitOrientation === 'vertical'
    ? 'Switch to side-by-side split'
    : 'Switch to top-bottom split'
  const fullscreenLabel = isFullscreen ? 'Exit full screen' : 'Full screen'

  return (
    <div className="fci-terminal-header" style={{ marginBottom: 10 }}>
      <div className="fci-section-title" style={{ position: 'static' }}>
        SQL Editor — {databaseName}
      </div>
      <div className="fci-terminal-actions">
        {isFullscreen && (
          <button
            type="button"
            className="fci-terminal-btn"
            title={splitLabel}
            onClick={onToggleSplit}
            aria-label={splitLabel}
          >
            {splitOrientation === 'vertical' ? '◧' : '⬒'}
          </button>
        )}
        <button
          type="button"
          className="fci-terminal-btn"
          title={fullscreenLabel}
          onClick={onToggleFullscreen}
          aria-label={fullscreenLabel}
        >
          {isFullscreen ? '⤦' : '⛶'}
        </button>
        {onOpenInNewTab && (
          <button
            type="button"
            className="fci-terminal-btn"
            title="Open in new tab"
            onClick={onOpenInNewTab}
            aria-label="Open in new tab"
          >
            ↗
          </button>
        )}
      </div>
    </div>
  )
}

interface SqlEditorActionsProps {
  readonly isPending: boolean
  readonly onRunQuery: () => void
  readonly onClear: () => void
  readonly onFormat: () => void
}

function SqlEditorActions({ isPending, onRunQuery, onClear, onFormat }: Readonly<SqlEditorActionsProps>) {
  return (
    <div className="fci-sql-actions">
      <button
        type="button"
        className="fci-linkbtn fci-action-add"
        disabled={isPending}
        onClick={onRunQuery}
        aria-label="Execute SQL script"
      >
        {isPending ? 'Executing…' : 'Execute (⌘/Ctrl+Enter)'}
      </button>
      <button type="button" className="fci-linkbtn fci-action-back" onClick={onClear} aria-label="Clear script">
        Clear
      </button>
      <button type="button" className="fci-linkbtn fci-action-edit" onClick={onFormat} aria-label="Format script">
        Format
      </button>
    </div>
  )
}

function useSqlExecution(selectedDatabaseId: string | null, sqlScript: string, scriptRef: React.MutableRefObject<{ databaseId: string | null, script: string }>) {
  const executeSql = useExecuteSql()
  const [queryResults, setQueryResults] = useState<Record<string, ScopedQueryResult>>({})

  const resetMutation = executeSql.reset
  useEffect(() => {
    resetMutation()
  }, [selectedDatabaseId, resetMutation])

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
          const errorMessage = getApiErrorMessage(error, 'Query failed')
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
  }, [selectedDatabaseId, sqlScript, executeSql, scriptRef])

  return { executeSql, queryResults, runQuery }
}

function useKeyboardShortcuts(
  isFullscreen: boolean,
  standalone: boolean,
  setIsFullscreen: (v: boolean) => void,
  runQuery: () => void
) {
  useEffect(() => {
    if (!isFullscreen || standalone) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, standalone, setIsFullscreen])

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
}

interface SqlEditorContentProps {
  readonly databaseId: string
  readonly databaseName: string
  readonly engine?: string
  readonly sqlScript: string
  readonly isFullscreen: boolean
  readonly standalone: boolean
  readonly splitOrientation: 'vertical' | 'horizontal'
  readonly status: ScopedQueryResult['status']
  readonly result: SqlExecutionResult | null
  readonly isPending: boolean
  readonly onToggleFullscreen: () => void
  readonly onToggleSplit: () => void
  readonly onRunQuery: () => void
  readonly onClear: () => void
  readonly onFormat: () => void
  readonly onScriptChange: (value: string) => void
}

function SqlEditorContent({
  databaseId,
  databaseName,
  engine,
  sqlScript,
  isFullscreen,
  standalone,
  splitOrientation,
  status,
  result,
  isPending,
  onToggleFullscreen,
  onToggleSplit,
  onRunQuery,
  onClear,
  onFormat,
  onScriptChange,
}: Readonly<SqlEditorContentProps>) {
  const standaloneUrl = getStandaloneSqlEditorUrl(databaseId)
  const openInNewTab = standalone ? undefined : () => window.open(standaloneUrl, '_blank', 'noopener,noreferrer')

  return (
    <>
      <SqlEditorHeader
        databaseName={databaseName}
        isFullscreen={isFullscreen}
        splitOrientation={splitOrientation}
        onToggleFullscreen={onToggleFullscreen}
        onToggleSplit={onToggleSplit}
        onOpenInNewTab={openInNewTab}
      />

      <SqlEditorActions
        isPending={isPending}
        onRunQuery={onRunQuery}
        onClear={onClear}
        onFormat={onFormat}
      />

      <div role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        {isPending && 'Executing SQL'}
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
          <LazySqlEditor
            value={sqlScript}
            onChange={onScriptChange}
            height="100%"
            isLoading={isPending}
            language={sqlEditorLanguageForEngine(engine)}
          />
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
}

export function SqlEditorSection({ selectedDatabaseId, standalone = false }: Readonly<SqlEditorSectionProps>) {
  const { data: databases } = useDatabases()
  const database = databases?.find((db) => db.id === selectedDatabaseId)
  
  const sqlScript = useDatabaseStore((state) => state.getSqlScript(selectedDatabaseId))
  const setSqlScriptInStore = useDatabaseStore((state) => state.setSqlScript)
  const scriptRef = useRef({ databaseId: selectedDatabaseId, script: sqlScript })
  
  const [isFullscreen, setIsFullscreen] = useState(standalone)
  const [splitOrientation, setSplitOrientation] = useState<'vertical' | 'horizontal'>('vertical')

  useEffect(() => {
    scriptRef.current = { databaseId: selectedDatabaseId, script: sqlScript }
  }, [selectedDatabaseId, sqlScript])

  const { executeSql, queryResults, runQuery } = useSqlExecution(selectedDatabaseId, sqlScript, scriptRef)
  
  useKeyboardShortcuts(isFullscreen, standalone, setIsFullscreen, runQuery)

  const handleScriptChange = useCallback((value: string) => {
    if (selectedDatabaseId) {
      setSqlScriptInStore(selectedDatabaseId, value)
    }
  }, [selectedDatabaseId, setSqlScriptInStore])

  const handleClear = useCallback(() => {
    if (sqlScript.trim() && !window.confirm('Clear the current script?')) return
    handleScriptChange('')
  }, [sqlScript, handleScriptChange])

  const handleFormat = useCallback(async () => {
    try {
      const { format: formatSql } = await import('sql-formatter')
      handleScriptChange(formatSql(sqlScript, { language: 'postgresql' }))
    } catch {
      // leave script unchanged if it can't be formatted
    }
  }, [sqlScript, handleScriptChange])

  if (!selectedDatabaseId) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">SQL Editor</div>
        <div style={{ color: 'var(--dash-text-dim)' }}>Select a database to open the SQL editor</div>
      </div>
    )
  }

  const activeResult = queryResults[selectedDatabaseId]
  const isExecutingCurrentDb = executeSql.isPending && executeSql.variables?.databaseId === selectedDatabaseId
  const { status, result } = getQueryPresentation(activeResult, isExecutingCurrentDb)

  const content = (
    <SqlEditorContent
      databaseId={selectedDatabaseId}
      databaseName={database?.name ?? selectedDatabaseId}
      engine={database?.engine}
      sqlScript={sqlScript}
      isFullscreen={isFullscreen}
      standalone={standalone}
      splitOrientation={splitOrientation}
      status={status}
      result={result}
      isPending={executeSql.isPending}
      onToggleFullscreen={() => setIsFullscreen((v) => !v)}
      onToggleSplit={() => setSplitOrientation((v) => (v === 'vertical' ? 'horizontal' : 'vertical'))}
      onRunQuery={runQuery}
      onClear={handleClear}
      onFormat={handleFormat}
      onScriptChange={handleScriptChange}
    />
  )

  if (isFullscreen) {
    return <div className="fci-terminal-fullscreen">{content}</div>
  }

  return <div className="fci-tab-content">{content}</div>
}
