import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VmTabContent } from '../VmTabContent'

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

globalThis.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

describe('VmTabContent — Terminal Feature Flag & Props', () => {
  const originalEnv = import.meta.env.VITE_ENABLE_REAL_TERMINAL

  beforeEach(() => {
    vi.stubEnv('VITE_ENABLE_REAL_TERMINAL', 'false')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults to mock mode when VITE_ENABLE_REAL_TERMINAL is false', () => {
    render(<VmTabContent tab="console" selectedVmId="vm-01" vmName="test-instance" />)

    expect(screen.getByText('Serial Console')).toBeInTheDocument()
    expect(screen.getByText('SSH Access')).toBeInTheDocument()
    expect(screen.queryByText('WebSocket URL not configured.')).not.toBeInTheDocument()
  })

  it('uses websocket mode when VITE_ENABLE_REAL_TERMINAL is "true"', () => {
    vi.stubEnv('VITE_ENABLE_REAL_TERMINAL', 'true')

    render(<VmTabContent tab="console" selectedVmId="vm-01" vmName="test-instance" />)

    expect(screen.getByText('Serial Console')).toBeInTheDocument()
    expect(screen.getByText('SSH Access')).toBeInTheDocument()
  })

  it('renders storage tab content correctly', () => {
    render(<VmTabContent tab="storage" selectedVmId="vm-01" vmName="test-instance" />)

    expect(screen.getByText('Attached Volumes')).toBeInTheDocument()
    expect(screen.getByText('boot-disk')).toBeInTheDocument()
  })

  it('renders network tab content correctly', () => {
    render(<VmTabContent tab="network" selectedVmId="vm-01" vmName="test-instance" />)

    expect(screen.getByText('Interfaces')).toBeInTheDocument()
    expect(screen.getByText('nic0')).toBeInTheDocument()
  })

  it('renders backups tab content correctly', () => {
    render(<VmTabContent tab="backups" selectedVmId="vm-01" vmName="test-instance" />)

    expect(screen.getByText('Backup History')).toBeInTheDocument()
    expect(screen.getByText('bkp-001')).toBeInTheDocument()
  })
})
