/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §4.5, §4.6, §7.10
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { ErrorRetry } from '../ErrorRetry'

describe('ErrorRetry', () => {
  it('renders the failure message interpolated with resourceLabel', () => {
    render(<ErrorRetry resourceLabel="metrics" onRetry={() => {}} />)
    expect(screen.getByText(/Failed to load metrics\./)).toBeInTheDocument()
  })

  it('renders a Retry button and calls onRetry when clicked', () => {
    const onRetry = vi.fn()
    render(<ErrorRetry resourceLabel="objects" onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: /Retry/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not use the legacy QueryState/Tailwind styling — text color is the fci- dashboard status-down variable', () => {
    const { container } = render(<ErrorRetry resourceLabel="metrics" onRetry={() => {}} />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.color).toBe('var(--dash-status-down)')
  })

  it('renders with role="alert" for accessibility', () => {
    render(<ErrorRetry resourceLabel="metrics" onRetry={() => {}} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(<ErrorRetry resourceLabel="metrics" onRetry={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

