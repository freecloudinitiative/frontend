import { useState, type InputHTMLAttributes } from 'react'

interface TerminalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export function TerminalInput({ hasError, className = '', value, onFocus, onBlur, ...rest }: TerminalInputProps) {
  const [focused, setFocused] = useState(false)
  const charCount = String(value ?? '').length

  return (
    <div
      className={`fci-terminal-wrap${focused ? ' fci-focused' : ''}`}
      style={{ '--fci-chars': charCount } as React.CSSProperties}
    >
      <input
        className={`fci-terminal-input${hasError ? ' fci-form-input-error' : ''} ${className}`}
        value={value}
        onFocus={(event) => {
          setFocused(true)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          setFocused(false)
          onBlur?.(event)
        }}
        {...rest}
      />
    </div>
  )
}
