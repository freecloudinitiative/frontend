/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §4.2, §4.3, §7.9
 *
 * Note: §4.4 (gate doesn't render at all on desktop viewports) is a caller-side concern —
 * ComputeEngineTabContent/DatabaseTabContent only render <MobileFullscreenGate> when
 * useIsMobile() is true, this component has no breakpoint logic of its own to test.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { MobileFullscreenGate } from '../MobileFullscreenGate'

describe('MobileFullscreenGate', () => {
  it('renders icon/title/subtitle/tag from props, not hardcoded copy', () => {
    render(
      <MobileFullscreenGate
        icon="⚡"
        title="Compute Engine Serial Console"
        subtitle="Tap Connect to launch full-screen terminal environment"
        tag="Terminal: my-instance"
        ariaLabel="Full-screen console for my-instance"
        isOpen={false}
        onOpen={() => {}}
        onClose={() => {}}
        blurredContent={<div>terminal-blurred</div>}
        fullscreenContent={<div>terminal-fullscreen</div>}
      />,
    )
    expect(screen.getByText('Compute Engine Serial Console')).toBeInTheDocument()
    expect(screen.getByText('Tap Connect to launch full-screen terminal environment')).toBeInTheDocument()
    expect(screen.getByText('⚡')).toBeInTheDocument()
  })

  it('two instances with different props (CE console vs DB SQL editor) do not leak each other\'s copy', () => {
    const { unmount } = render(
      <MobileFullscreenGate
        icon="⚡"
        title="Compute Engine Serial Console"
        subtitle="ce-subtitle"
        tag="ce-tag"
        ariaLabel="ce-aria"
        isOpen={false}
        onOpen={() => {}}
        onClose={() => {}}
        blurredContent={<div />}
        fullscreenContent={<div />}
      />,
    )
    expect(screen.queryByText('Database Query Editor')).not.toBeInTheDocument()
    unmount()

    render(
      <MobileFullscreenGate
        icon="⚡"
        title="Database Query Editor"
        subtitle="db-subtitle"
        tag="db-tag"
        ariaLabel="db-aria"
        isOpen={false}
        onOpen={() => {}}
        onClose={() => {}}
        blurredContent={<div />}
        fullscreenContent={<div />}
      />,
    )
    expect(screen.getByText('Database Query Editor')).toBeInTheDocument()
    expect(screen.queryByText('Compute Engine Serial Console')).not.toBeInTheDocument()
  })

  it('shows blurredContent (not fullscreenContent) and a Connect button when closed', () => {
    render(
      <MobileFullscreenGate
        icon="⚡"
        title="t"
        subtitle="s"
        tag="tag"
        ariaLabel="aria"
        isOpen={false}
        onOpen={() => {}}
        onClose={() => {}}
        blurredContent={<div>blurred-marker</div>}
        fullscreenContent={<div>fullscreen-marker</div>}
      />,
    )
    expect(screen.getByText('blurred-marker')).toBeInTheDocument()
    expect(screen.queryByText('fullscreen-marker')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Connect/ })).toBeInTheDocument()
  })

  it('renders fullscreenContent inside the dialog and an Exit button when open, with no blurred content', () => {
    render(
      <MobileFullscreenGate
        icon="⚡"
        title="t"
        subtitle="s"
        tag="tag"
        ariaLabel="aria"
        isOpen={true}
        onOpen={() => {}}
        onClose={() => {}}
        blurredContent={<div>blurred-marker</div>}
        fullscreenContent={<div>fullscreen-marker</div>}
      />,
    )
    expect(screen.getByText('fullscreen-marker')).toBeInTheDocument()
    expect(screen.queryByText('blurred-marker')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exit full screen mode/ })).toBeInTheDocument()
  })

  it('calling onOpen (Connect) and onClose (Exit) fires the respective callback', () => {
    const onOpen = vi.fn()
    const onClose = vi.fn()

    const { rerender } = render(
      <MobileFullscreenGate
        icon="⚡"
        title="t"
        subtitle="s"
        tag="tag"
        ariaLabel="aria"
        isOpen={false}
        onOpen={onOpen}
        onClose={onClose}
        blurredContent={<div />}
        fullscreenContent={<div />}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Connect/ }))
    expect(onOpen).toHaveBeenCalledTimes(1)

    rerender(
      <MobileFullscreenGate
        icon="⚡"
        title="t"
        subtitle="s"
        tag="tag"
        ariaLabel="aria"
        isOpen={true}
        onOpen={onOpen}
        onClose={onClose}
        blurredContent={<div />}
        fullscreenContent={<div />}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Exit full screen mode/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('pressing Escape key while modal is open fires onClose', () => {
    const onClose = vi.fn()
    render(
      <MobileFullscreenGate
        icon="⚡"
        title="t"
        subtitle="s"
        tag="tag"
        ariaLabel="aria"
        isOpen={true}
        onOpen={() => {}}
        onClose={onClose}
        blurredContent={<div />}
        fullscreenContent={<div />}
      />,
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('MobileFullscreenGate — axe a11y audit', () => {
  it('has zero axe violations in the closed (gated) state', async () => {
    const { container } = render(
      <MobileFullscreenGate
        icon="⚡"
        title="Compute Engine Serial Console"
        subtitle="Tap Connect to launch full-screen terminal environment"
        tag="tag"
        ariaLabel="aria"
        isOpen={false}
        onOpen={() => {}}
        onClose={() => {}}
        blurredContent={<div>content</div>}
        fullscreenContent={<div>content</div>}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has zero axe violations in the open (fullscreen dialog) state', async () => {
    const { container } = render(
      <MobileFullscreenGate
        icon="⚡"
        title="Compute Engine Serial Console"
        subtitle="Tap Connect to launch full-screen terminal environment"
        tag="Terminal: my-instance"
        ariaLabel="Full-screen console for my-instance"
        isOpen={true}
        onOpen={() => {}}
        onClose={() => {}}
        blurredContent={<div>content</div>}
        fullscreenContent={<div>content</div>}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
