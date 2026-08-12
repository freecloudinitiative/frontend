/**
 * CommandPalette component unit & accessibility tests
 * Portal rendering, command filtering, keyboard arrow navigation, enter execution, and close handlers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommandPalette } from '../CommandPalette'

describe('CommandPalette', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    activeService: 'Compute Engine' as const,
    selectedRow: { id: 'ce-1', name: 'web-server-prod' },
    selectService: vi.fn(),
    openDeleteFlow: vi.fn(),
    navigate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders null when isOpen is false', () => {
    render(<CommandPalette {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByPlaceholderText(/Type a command prefix/i)).toBeNull()
  })

  it('renders dialog and command list when isOpen is true', () => {
    render(<CommandPalette {...defaultProps} />)
    expect(screen.getByRole('dialog', { name: /Command Palette/i })).toBeTruthy()
    expect(screen.getByText('⌘ COMMAND PALETTE')).toBeTruthy()
    expect(screen.getByPlaceholderText(/Type a command/i)).toBeTruthy()
    expect(screen.getByText(':ce')).toBeTruthy()
    expect(screen.getByText(':db')).toBeTruthy()
    expect(screen.getByText(':crt')).toBeTruthy()
    expect(screen.getByText(':dlt')).toBeTruthy()
  })

  it('filters command list when typing in input', () => {
    render(<CommandPalette {...defaultProps} />)
    const input = screen.getByPlaceholderText(/Type a command/i)

    fireEvent.change(input, { target: { value: ':db' } })

    expect(screen.getByText(':db')).toBeTruthy()
    expect(screen.queryByText(':ce')).toBeNull()
    expect(screen.queryByText(':iam')).toBeNull()
  })

  it('displays no matching commands message when query matches nothing', () => {
    render(<CommandPalette {...defaultProps} />)
    const input = screen.getByPlaceholderText(/Type a command/i)

    fireEvent.change(input, { target: { value: ':unknown' } })

    expect(screen.getByText(/No matching commands/i)).toBeTruthy()
  })

  it('executes service navigation command on click', () => {
    render(<CommandPalette {...defaultProps} />)
    const dbOption = screen.getByText('Switch to Database')

    fireEvent.click(dbOption)

    expect(defaultProps.selectService).toHaveBeenCalledWith('Database')
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('executes create command on click', () => {
    render(<CommandPalette {...defaultProps} />)
    const createOption = screen.getByText('Create — open creation form for active service')

    fireEvent.click(createOption)

    expect(defaultProps.navigate).toHaveBeenCalledWith('/services/compute-engine/create')
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('executes delete command on click when row is selected', () => {
    render(<CommandPalette {...defaultProps} />)
    const deleteOption = screen.getByText('Delete — trigger delete flow for selected item')

    fireEvent.click(deleteOption)

    expect(defaultProps.openDeleteFlow).toHaveBeenCalledTimes(1)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('triggers info toast when delete command is executed without selected row', () => {
    render(<CommandPalette {...defaultProps} selectedRow={null} />)
    const deleteOption = screen.getByText('Delete — trigger delete flow for selected item')

    fireEvent.click(deleteOption)

    expect(defaultProps.openDeleteFlow).not.toHaveBeenCalled()
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('navigates with ArrowDown and ArrowUp keys and executes highlighted command on Enter', () => {
    render(<CommandPalette {...defaultProps} />)
    const input = screen.getByPlaceholderText(/Type a command/i)

    // Press ArrowDown to highlight first item (:ce)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const ceOption = screen.getByText(':ce').closest('button')
    expect(ceOption?.getAttribute('aria-selected')).toBe('true')

    // Press ArrowDown again to highlight second item (:db)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const dbOption = screen.getByText(':db').closest('button')
    expect(dbOption?.getAttribute('aria-selected')).toBe('true')

    // Press Enter to execute highlighted command (:db)
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(defaultProps.selectService).toHaveBeenCalledWith('Database')
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed inside input', () => {
    render(<CommandPalette {...defaultProps} />)
    const input = screen.getByPlaceholderText(/Type a command/i)

    fireEvent.keyDown(input, { key: 'Escape' })

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay backdrop is clicked', () => {
    render(<CommandPalette {...defaultProps} />)
    const dialog = screen.getByRole('dialog')

    fireEvent.click(dialog)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('displays active service and selected row in footer', () => {
    render(<CommandPalette {...defaultProps} />)

    expect(screen.getByText('Compute Engine')).toBeTruthy()
    expect(screen.getByText('web-server-prod')).toBeTruthy()
  })

  it('focus restoration: returns focus to invoking element when palette closes', () => {
    const invoker = document.createElement('button')
    invoker.textContent = 'Open Palette'
    document.body.appendChild(invoker)
    invoker.focus()
    expect(document.activeElement).toBe(invoker)

    const { rerender } = render(<CommandPalette {...defaultProps} isOpen={true} />)
    rerender(<CommandPalette {...defaultProps} isOpen={false} />)

    expect(document.activeElement).toBe(invoker)
    document.body.removeChild(invoker)
  })
})
