import { useEffect, useRef, useState } from 'react'

interface TerminalSelectOption {
  value: string
  label?: string
}

interface TerminalSelectProps {
  id?: string
  label: string
  value: string
  options: readonly string[] | readonly TerminalSelectOption[]
  onChange: (value: string) => void
  hasError?: boolean
}

function normalize(options: TerminalSelectProps['options']): TerminalSelectOption[] {
  return options.map((option) => (typeof option === 'string' ? { value: option } : option))
}

export function TerminalSelect({ id, label, value, options, onChange, hasError }: TerminalSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const normalized = normalize(options)
  const selected = normalized.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    // .fci-fieldbox is the bordered, position:relative container (same role as
    // .fci-box for the Profile menu) so the shared .fci-dd-menu left:-1px/right:-1px
    // rule flush-aligns the overlay to THIS element's own border — not to some
    // inner trigger inset by the fieldbox's padding.
    <div
      id={id}
      ref={rootRef}
      className={`fci-fieldbox fci-dropdown fci-terminal-select${open ? ' fci-open' : ''}${hasError ? ' fci-form-input-error' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => setOpen((prev) => !prev)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setOpen((prev) => !prev)
        }
      }}
    >
      <label className="fci-box-label">{label}</label>
      <span className="fci-dd-selected">{selected?.label ?? selected?.value ?? value}</span>
      <span className="fci-dd-arrow">&#9660;</span>
      <div className="fci-dd-menu">
        {normalized.map((option) => (
          <div
            key={option.value}
            className={`fci-dd-item${option.value === value ? ' fci-dd-item-selected' : ''}`}
            onClick={(event) => {
              event.stopPropagation()
              onChange(option.value)
              setOpen(false)
            }}
          >
            {option.label ?? option.value}
          </div>
        ))}
      </div>
    </div>
  )
}
