import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TerminalSelect } from '@/components/TerminalSelect'

describe('TerminalSelect', () => {
  it('does not change or close when a disabled option is clicked', () => {
    const onChange = vi.fn()
    render(
      <TerminalSelect
        label="Region"
        value="IST"
        options={[
          { value: 'IST' },
          { value: 'ANK', disabled: true },
        ]}
        onChange={onChange}
      />,
    )

    const select = screen.getByRole('button', { name: /Region/i })
    fireEvent.click(select)
    expect(select).toHaveClass('fci-open')

    const disabledOption = screen.getByText('ANK')
    expect(disabledOption).toHaveClass('fci-dd-item-disabled')
    expect(disabledOption).toHaveStyle({ cursor: 'not-allowed' })
    fireEvent.click(disabledOption)

    expect(onChange).not.toHaveBeenCalled()
    expect(select).toHaveClass('fci-open')
    expect(select).toHaveTextContent('IST')
  })
})
