import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TerminalView } from '../TerminalView'

// Mock xterm to avoid canvas dependency in jsdom environment
vi.mock('@xterm/xterm', () => {
  return {
    Terminal: class {
      open = vi.fn()
      loadAddon = vi.fn()
      write = vi.fn()
      writeln = vi.fn()
      clear = vi.fn()
      dispose = vi.fn()
      onData = vi.fn().mockReturnValue({ dispose: vi.fn() })
    },
  }
})

vi.mock('@xterm/addon-fit', () => {
  return {
    FitAddon: class {
      fit = vi.fn()
    },
  }
})

// Mock ResizeObserver
globalThis.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = 1
  send = vi.fn()
  close = vi.fn()
  onmessage = null
  onclose = null
  onerror = null
}

describe('<TerminalView />', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders title and an unconfigured notice when no real URL provider is supplied', () => {
    render(<TerminalView computeEngineName="test-ce" title="Serial Console" />)
    expect(screen.getByText('Serial Console')).toBeInTheDocument()
    expect(screen.getByText('WebSocket URL not configured.')).toBeInTheDocument()
  })

  it('renders unconfigured notice when urlProvider is missing', () => {
    render(<TerminalView computeEngineName="test-ce" title="Serial Console" />)
    expect(screen.getByText('WebSocket URL not configured.')).toBeInTheDocument()
  })

  it('renders terminal container when urlProvider is provided', () => {
    const urlProvider = () => Promise.resolve('ws://localhost:8080/ws/terminal/ce-1')
    render(
      <TerminalView
        urlProvider={urlProvider}
        computeEngineName="test-ce"
        title="Serial Console"
      />,
    )
    expect(screen.getByRole('group', { name: 'Serial Console' })).toBeInTheDocument()
  })

  it('opens the protected UUID console route instead of a name-only mock route', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const urlProvider = () => Promise.resolve('ws://localhost:8080/ws/terminal/ce-1')
    render(
      <TerminalView
        computeEngineId="ce/id-1"
        computeEngineName="test instance"
        urlProvider={urlProvider}
      />,
    )

    fireEvent.click(screen.getByTitle('Open in new tab'))

    expect(open).toHaveBeenCalledWith(
      '/console/ce%2Fid-1?name=test+instance',
      '_blank',
      'noopener,noreferrer',
    )
  })
})
