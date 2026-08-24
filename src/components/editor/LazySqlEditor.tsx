import { Component, lazy, Suspense, useState, type ComponentType, type ErrorInfo, type ReactNode } from 'react'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { ErrorRetry } from '@/features/dashboard/tabs/shared/ErrorRetry'
import type { SqlEditorProps } from './SqlEditor'

interface EditorChunkBoundaryProps {
  children: ReactNode
  onRetry: () => void
}

interface EditorChunkBoundaryState {
  failed: boolean
}

class EditorChunkBoundary extends Component<EditorChunkBoundaryProps, EditorChunkBoundaryState> {
  state: EditorChunkBoundaryState = { failed: false }

  static getDerivedStateFromError(): EditorChunkBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SQL editor chunk]', error, info)
  }

  render() {
    if (this.state.failed) {
      return <ErrorRetry resourceLabel="editor" onRetry={this.props.onRetry} />
    }
    return this.props.children
  }
}

type SqlEditorLoader = () => Promise<{ default: ComponentType<SqlEditorProps> }>

const loadSqlEditor: SqlEditorLoader = () =>
  import('./SqlEditor').then((module) => ({ default: module.SqlEditor }))

function createLazyEditor(loader: SqlEditorLoader) {
  return lazy(loader)
}

export function LazySqlEditor({ loader = loadSqlEditor, ...props }: SqlEditorProps & { loader?: SqlEditorLoader }) {
  const [attempt, setAttempt] = useState(0)
  const [Editor, setEditor] = useState(() => createLazyEditor(loader))

  function retry() {
    setEditor(() => createLazyEditor(loader))
    setAttempt((value) => value + 1)
  }

  return (
    <EditorChunkBoundary key={attempt} onRetry={retry}>
      <Suspense fallback={<DashboardLoading label="LOADING EDITOR..." />}>
        <Editor {...props} />
      </Suspense>
    </EditorChunkBoundary>
  )
}
