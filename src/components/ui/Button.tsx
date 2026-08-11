// NOTE: This component uses the legacy Tailwind styling system. The dashboard uses fci-* CSS classes.
// Retained for /ui-preview route only.
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'danger'
}

export function Button({ variant = 'default', disabled, children, className = '', ...rest }: ButtonProps) {
  const variantClasses =
    variant === 'danger'
      ? 'text-tui-stopped hover:text-tui-bg hover:bg-tui-stopped focus-visible:outline-tui-stopped'
      : 'text-tui-fg hover:text-tui-bg hover:bg-tui-accent focus-visible:outline-tui-accent'

  return (
    <button
      disabled={disabled}
      className={`font-mono border border-tui-border bg-transparent px-2 py-1 outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-tui-fg ${variantClasses} ${className}`}
      {...rest}
    >
      [ {children} ]
    </button>
  )
}
