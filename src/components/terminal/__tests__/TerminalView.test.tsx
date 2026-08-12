import { render, screen } from '@testing-library/react'
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

  it('renders title and terminal container in default mock mode', () => {
    render(<TerminalView computeEngineName="test-ce" title="Serial Console" />)
    expect(screen.getByText('Serial Console')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Serial Console' })).toBeInTheDocument()
  })

  it('renders unconfigured notice when mode="websocket" but wsUrl is missing', () => {
    render(<TerminalView mode="websocket" computeEngineName="test-ce" title="Serial Console" />)
    expect(screen.getByText('WebSocket URL not configured.')).toBeInTheDocument()
  })

  it('renders terminal container when mode="websocket" and wsUrl is provided', () => {
    render(
      <TerminalView
        mode="websocket"
        wsUrl="ws://localhost:8080/ws/terminal/ce-1"
        computeEngineName="test-ce"
        title="Serial Console"
      />,
    )
    expect(screen.getByRole('group', { name: 'Serial Console' })).toBeInTheDocument()
  })
})
