/**
 * CommandPalette — automated axe-core accessibility tests (PR #37)
 *
 * Renders the palette in its open state and asserts zero critical/serious
 * axe violations on the portal-rendered markup.
 */
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { CommandPalette } from '@/features/dashboard/CommandPalette'

const baseProps = {
  isOpen: true,
  onClose: () => {},
  activeService: 'VM' as const,
  selectedRow: null,
  selectService: () => {},
  openDeleteFlow: () => {},
  navigate: () => {},
}

describe('CommandPalette — axe a11y audit', () => {
  it('has zero critical/serious axe violations when open', async () => {
    render(<CommandPalette {...baseProps} />)
    // The palette renders via portal into document.body
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()
  })

  it('has zero violations with a selected row context', async () => {
    render(
      <CommandPalette
        {...baseProps}
        selectedRow={{ id: 'vm-1', name: 'web-server-01' }}
      />,
    )
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()
  })
})
