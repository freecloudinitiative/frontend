import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('applies the shared input class while preserving consumer classes and refs', () => {
    const ref = createRef<HTMLInputElement>()

    render(<Input ref={ref} className="consumer-input" aria-label="Name" />)

    const input = screen.getByRole('textbox', { name: 'Name' })
    expect(input).toHaveClass('fci-input', 'consumer-input')
    expect(ref.current).toBe(input)
  })

  it('exposes a consistent invalid state', () => {
    render(<Input hasError aria-label="Invalid name" />)

    expect(screen.getByRole('textbox', { name: 'Invalid name' })).toHaveClass('fci-form-input-error')
    expect(screen.getByRole('textbox', { name: 'Invalid name' })).toHaveAttribute('aria-invalid', 'true')
  })
})
