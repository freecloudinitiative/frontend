const HLINE = '─'.repeat(400)

interface DividerProps {
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function Divider({ className = '', orientation = 'horizontal' }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div className={`relative w-[0.6em] shrink-0 select-none ${className}`}>
        <span className="absolute top-0 bottom-0 left-[0.3em] w-px -translate-x-1/2 bg-tui-border" />
      </div>
    )
  }

  return (
    <div className={`select-none overflow-hidden whitespace-nowrap text-tui-border ${className}`}>
      {HLINE}
    </div>
  )
}
