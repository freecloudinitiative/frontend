import type { ReactNode } from 'react'

interface PanelProps {
  title?: string
  children: ReactNode
  className?: string
}

export function Panel({ title, children, className = '' }: PanelProps) {
  return (
    <div className={`border border-tui-border bg-tui-bg ${className}`}>
      {title && (
        <div className="border-b border-tui-border px-3 py-1 text-sm text-tui-accent">
          {title}
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  )
}
