import { lazy, Suspense } from 'react'
import type { BeforeMount, OnMount } from '@monaco-editor/react'

const Editor = lazy(() => import('@monaco-editor/react'))

const MONACO_THEME_NAME = 'fci-sql-dark'

interface SqlEditorProps {
  value: string
  onChange: (newValue: string) => void
  readOnly?: boolean
  height?: string
  theme?: 'dark' | 'light'
  placeholder?: string
  isLoading?: boolean
}

export function SqlEditor({
  value,
  onChange,
  readOnly = false,
  height = '300px',
  theme = 'dark',
  isLoading = false,
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
        language="sql"
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
