import { Suspense } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import type { BeforeMount, OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/editor/editor.api'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import 'monaco-editor/languages/definitions/mysql/register'
import 'monaco-editor/languages/definitions/pgsql/register'
import 'monaco-editor/languages/definitions/sql/register'
import type { SqlEditorLanguage } from './sqlLanguage'

// Serve Monaco from the bundle instead of @monaco-editor/react's default CDN
// loader (cdn.jsdelivr.net). The production CSP is `script-src 'self'`, so the
// CDN fetch is blocked and the editor never mounts. Vite emits the worker as a
// same-origin chunk, which `worker-src 'self'` already allows.
//
// SQL is a Monarch basic-language and tokenises on the main thread, so the base
// editor worker is the only one needed; it is also the correct fallback for any
// other label Monaco might ask for.
self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}

loader.config({ monaco })

const MONACO_THEME_NAME = 'fci-sql-dark'

export interface SqlEditorProps {
  value: string
  onChange: (newValue: string) => void
  readOnly?: boolean
  height?: string
  theme?: 'dark' | 'light'
  placeholder?: string
  isLoading?: boolean
  language?: SqlEditorLanguage
}

export function SqlEditor({
  value,
  onChange,
  readOnly = false,
  height = '300px',
  theme = 'dark',
  isLoading = false,
  language = 'pgsql',
}: SqlEditorProps) {
  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme(MONACO_THEME_NAME, {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '4fa8dc' },
        { token: 'string', foreground: '7ec87e' },
        { token: 'comment', foreground: '6b7280' },
      ],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#dcdcdc',
        'editorCursor.foreground': '#7ec87e',
        'editor.selectionBackground': '#1e3a52',
      },
    })
  }

  const handleMount: OnMount = (editor, monaco) => {
    monaco.editor.setTheme(MONACO_THEME_NAME)
    editor.focus()
  }

  return (
    <Suspense fallback={<div style={{ height, color: 'var(--dash-text-dim)' }}>Loading editor…</div>}>
      <Editor
        height={height}
        language={language}
        theme={theme === 'dark' ? MONACO_THEME_NAME : 'light'}
        value={value}
        onChange={(newValue) => onChange(newValue ?? '')}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          readOnly: readOnly || isLoading,
          lineNumbers: 'on',
          wordWrap: 'on',
          minimap: { enabled: false },
          tabSize: 2,
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 13,
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />
    </Suspense>
  )
}
