// NOTE: This component uses the legacy Tailwind styling system. The dashboard uses fci-* CSS classes.
// Retained for /ui-preview route only.
import type { ReactNode } from 'react'

interface PanelProps {
  title?: string
  children: ReactNode
  className?: string
}

export function Panel({ title, children, className = '' }: PanelProps) {
  return (
    <div className={`flex flex-col text-tui-border ${className}`}>
      <div className="flex shrink-0 items-center select-none whitespace-nowrap">
        <span>╭{title ? '─ ' : ''}</span>
        {title && <span className="text-tui-accent">{title}</span>}
        <span className={`h-px min-w-2 flex-1 bg-tui-border ${title ? 'ml-1' : ''}`} />
        <span>╮</span>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <span className="absolute top-0 bottom-0 left-[0.3em] w-px -translate-x-1/2 select-none bg-tui-border" />
        <div className="flex-1 overflow-auto px-4 py-2 text-tui-fg">{children}</div>
        <span className="absolute top-0 right-[0.3em] bottom-0 w-px translate-x-1/2 select-none bg-tui-border" />
      </div>

      <div className="flex shrink-0 items-center select-none whitespace-nowrap">
        <span>╰</span>
        <span className="h-px min-w-2 flex-1 bg-tui-border" />
        <span>╯</span>
      </div>
    </div>
  )
}
