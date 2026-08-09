import type { ReactNode } from 'react'

interface PanelProps {
  title?: string
  children: ReactNode
  className?: string
}

const HLINE = '─'.repeat(400)

export function Panel({ title, children, className = '' }: PanelProps) {
  return (
    <div className={`flex flex-col text-tui-border ${className}`}>
      <div className="flex shrink-0 select-none whitespace-nowrap">
        <span>┌{title ? '─ ' : ''}</span>
        {title && <span className="text-tui-accent">{title}</span>}
        <span className="min-w-2 flex-1 overflow-hidden">{title ? ` ${HLINE}` : HLINE}</span>
        <span>┐</span>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <span className="absolute top-0 bottom-0 left-[0.3em] w-px -translate-x-1/2 select-none bg-tui-border" />
        <div className="flex-1 overflow-auto px-4 py-2 text-tui-fg">{children}</div>
        <span className="absolute top-0 right-[0.3em] bottom-0 w-px translate-x-1/2 select-none bg-tui-border" />
      </div>

      <div className="flex shrink-0 select-none whitespace-nowrap">
        <span>└</span>
        <span className="min-w-2 flex-1 overflow-hidden">{HLINE}</span>
        <span>┘</span>
      </div>
    </div>
  )
}
