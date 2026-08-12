/**
 * DashboardModal component unit & accessibility tests
 * Portal rendering, title, children, backdrop click, Escape key dismiss, and focus management.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardModal } from '@/features/dashboard/DashboardModal'

describe('DashboardModal', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <DashboardModal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Modal Content</div>
      </DashboardModal>,
    )
    expect(screen.queryByText('Test Modal')).toBeNull()
    expect(screen.queryByText('Modal Content')).toBeNull()
  })

  it('renders title and children in a portal when isOpen is true', () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Confirm Action">
        <p>Are you sure?</p>
      </DashboardModal>,
    )
    expect(screen.getByText('Confirm Action')).toBeTruthy()
    expect(screen.getByText('Are you sure?')).toBeTruthy()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('has role="dialog" and aria-modal="true"', () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Modal Title">
        <button type="button">Inside Button</button>
      </DashboardModal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('calls onClose when close button (✕) is clicked', () => {
    const handleClose = vi.fn()
    render(
      <DashboardModal isOpen={true} onClose={handleClose} title="Close Test">
        <div>Body</div>
      </DashboardModal>,
    )
    const closeBtn = screen.getByLabelText('Close')
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking overlay background', () => {
    const handleClose = vi.fn()
    render(
      <DashboardModal isOpen={true} onClose={handleClose} title="Overlay Test">
        <div>Body</div>
      </DashboardModal>,
    )
    const overlay = screen.getByRole('dialog')
    fireEvent.click(overlay)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onClose when clicking inside the modal box content', () => {
    const handleClose = vi.fn()
    render(
      <DashboardModal isOpen={true} onClose={handleClose} title="Box Test">
        <button type="button">Inside</button>
      </DashboardModal>,
    )
    const insideBtn = screen.getByText('Inside')
    fireEvent.click(insideBtn)
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn()
    render(
      <DashboardModal isOpen={true} onClose={handleClose} title="Escape Test">
        <div>Body</div>
      </DashboardModal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('initial focus capture: automatically focuses the first focusable element inside the modal', () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Focus Test">
        <input type="text" placeholder="First Input" />
        <button type="button">Second Button</button>
      </DashboardModal>,
    )
    const closeBtn = screen.getByLabelText('Close')
    expect(document.activeElement).toBe(closeBtn)
  })

  it('forward focus trapping (Tab from last focusable element wraps to first)', () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Trap Test">
        <button type="button" id="btn-inside">Inside Button</button>
      </DashboardModal>,
    )
    const closeBtn = screen.getByLabelText('Close')
    const insideBtn = screen.getByRole('button', { name: 'Inside Button' })

    insideBtn.focus()
    expect(document.activeElement).toBe(insideBtn)

    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: false })
    expect(document.activeElement).toBe(closeBtn)
  })

  it('backward focus trapping (Shift+Tab from first focusable element wraps to last)', () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Shift Tab Test">
        <button type="button" id="btn-inside">Inside Button</button>
      </DashboardModal>,
    )
    const closeBtn = screen.getByLabelText('Close')
    const insideBtn = screen.getByRole('button', { name: 'Inside Button' })

    closeBtn.focus()
    expect(document.activeElement).toBe(closeBtn)

    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(insideBtn)
  })

  it('focus restoration: returns focus to invoking element when modal closes', () => {
    const invoker = document.createElement('button')
    invoker.textContent = 'Open Modal'
    document.body.appendChild(invoker)
    invoker.focus()
    expect(document.activeElement).toBe(invoker)

    const { unmount } = render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Restore Test">
        <button type="button">Inside</button>
      </DashboardModal>,
    )

    unmount()
    expect(document.activeElement).toBe(invoker)
    document.body.removeChild(invoker)
  })
})
