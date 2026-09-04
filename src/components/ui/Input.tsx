import { forwardRef, type InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

/** Shared native input primitive for consistent sizing, caret alignment, and validation state. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError = false, className = '', 'aria-invalid': ariaInvalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`fci-input${hasError ? ' fci-form-input-error' : ''}${className ? ` ${className}` : ''}`}
      aria-invalid={ariaInvalid ?? (hasError || undefined)}
      {...props}
    />
  )
})
