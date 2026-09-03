/**
 * mockShell and AsciiProgressBar unit tests.
 * Pure logic — no MSW server or React Query needed.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMockShell } from '@/components/terminal/mockShell'
import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'

// ---------------------------------------------------------------------------
// createMockShell
// ---------------------------------------------------------------------------

describe('createMockShell()', () => {
  const shell = createMockShell('prod-api-01')

  describe('getWelcomeBanner()', () => {
    it('contains the FCI branding', () => {
      expect(shell.getWelcomeBanner()).toContain('Free Cloud Initiative')
    })

    it('contains the Compute Engine name', () => {
      expect(shell.getWelcomeBanner()).toContain('prod-api-01')
    })

    it('prompts user to type help', () => {
      expect(shell.getWelcomeBanner()).toContain('help')
    })
  })

  describe('getPrompt()', () => {
    it('returns root@<computeEngineName>:~$ format', () => {
      expect(shell.getPrompt()).toBe('root@prod-api-01:~$ ')
    })

    it('includes the Compute Engine name in prompt', () => {
      const shell2 = createMockShell('dev-worker-03')
      expect(shell2.getPrompt()).toBe('root@dev-worker-03:~$ ')
    })
  })

  describe('runCommand() — all supported commands', () => {
    it('empty string → empty output, no clear', () => {
      const result = shell.runCommand('')
      expect(result.output).toBe('')
      expect(result.clear).toBeFalsy()
    })

    it('whitespace-only → empty output (trim)', () => {
      expect(shell.runCommand('   ').output).toBe('')
    })

    it('help → lists all commands', () => {
      const result = shell.runCommand('help')
      const out = result.output
      expect(out).toContain('help')
      expect(out).toContain('ls')
      expect(out).toContain('pwd')
      expect(out).toContain('whoami')
      expect(out).toContain('uname -a')
      expect(out).toContain('df -h')
      expect(out).toContain('free -m')
      expect(out).toContain('uptime')
      expect(out).toContain('clear')
      expect(result.clear).toBeFalsy()
    })

    it('ls → returns directory listing', () => {
      const result = shell.runCommand('ls')
      expect(result.output).toContain('bin')
      expect(result.output).toContain('etc')
      expect(result.clear).toBeFalsy()
    })

    it('pwd → returns /root', () => {
      expect(shell.runCommand('pwd').output).toBe('/root')
    })

    it('whoami → returns root', () => {
      expect(shell.runCommand('whoami').output).toBe('root')
    })

    it('uname -a → returns Linux kernel info string', () => {
      const result = shell.runCommand('uname -a')
      expect(result.output).toContain('Linux')
      expect(result.output).toContain('x86_64')
    })

    it('df -h → returns disk usage table', () => {
      const result = shell.runCommand('df -h')
      expect(result.output).toContain('Filesystem')
      expect(result.output).toContain('/dev/sda1')
      expect(result.output).toContain('Mounted on')
    })

    it('free -m → returns memory usage table', () => {
      const result = shell.runCommand('free -m')
      expect(result.output).toContain('Mem:')
      expect(result.output).toContain('Swap:')
    })

    it('uptime → returns uptime string', () => {
      const result = shell.runCommand('uptime')
      expect(result.output).toContain('up')
      expect(result.output).toContain('load average')
    })

    it('clear → returns empty output with clear=true', () => {
      const result = shell.runCommand('clear')
      expect(result.output).toBe('')
      expect(result.clear).toBe(true)
    })

    it('unknown command → returns "<cmd>: command not found"', () => {
      const result = shell.runCommand('sudo rm -rf /')
      expect(result.output).toBe('sudo rm -rf /: command not found')
      expect(result.clear).toBeFalsy()
    })

    it('unknown command with leading/trailing spaces → still resolves correctly', () => {
      const result = shell.runCommand('  curl  ')
      expect(result.output).toBe('curl: command not found')
    })
  })

  describe('createMockShell with different Compute Engine names', () => {
    it('each shell instance is scoped to its own Compute Engine name', () => {
      const s1 = createMockShell('ce-alpha')
      const s2 = createMockShell('ce-beta')
      expect(s1.getPrompt()).toContain('ce-alpha')
      expect(s2.getPrompt()).toContain('ce-beta')
      expect(s1.getWelcomeBanner()).toContain('ce-alpha')
      expect(s2.getWelcomeBanner()).toContain('ce-beta')
    })
  })
})

// ---------------------------------------------------------------------------
// AsciiProgressBar component
// ---------------------------------------------------------------------------

describe('AsciiProgressBar', () => {
  it('renders label and percentage', () => {
    render(<AsciiProgressBar label="vCPU" value={50} />)
    expect(screen.getByText('vCPU')).toBeTruthy()
    expect(screen.getByText('50%')).toBeTruthy()
  })

  it('0% → all empty blocks', () => {
    render(<AsciiProgressBar label="Test" value={0} width={10} />)
    expect(screen.getByText('░'.repeat(10))).toBeTruthy()
    expect(screen.getByText('0%')).toBeTruthy()
  })

  it('100% → all filled blocks', () => {
    render(<AsciiProgressBar label="Test" value={100} width={10} />)
    expect(screen.getByText('█'.repeat(10))).toBeTruthy()
    expect(screen.getByText('100%')).toBeTruthy()
  })

  it('50% with width=10 → 5 filled + 5 empty', () => {
    render(<AsciiProgressBar label="Test" value={50} width={10} />)
    expect(screen.getByText('█'.repeat(5))).toBeTruthy()
    expect(screen.getByText('░'.repeat(5))).toBeTruthy()
  })

  it('clamps value below 0 to 0%', () => {
    render(<AsciiProgressBar label="Test" value={-10} width={10} />)
    expect(screen.getByText('0%')).toBeTruthy()
    expect(screen.getByText('░'.repeat(10))).toBeTruthy()
  })

  it('clamps value above 100 to 100%', () => {
    render(<AsciiProgressBar label="Test" value={150} width={10} />)
    expect(screen.getByText('100%')).toBeTruthy()
    expect(screen.getByText('█'.repeat(10))).toBeTruthy()
  })

  it('uses default width of 20 when none is specified', () => {
    const { container } = render(<AsciiProgressBar label="Test" value={50} />)
    // At 50% with width 20 → 10 filled + 10 empty
    expect(container.textContent).toContain('█'.repeat(10))
    expect(container.textContent).toContain('░'.repeat(10))
  })

  it('rounds fractional fill count correctly (33% of 10 → 3 filled)', () => {
    render(<AsciiProgressBar label="Test" value={33} width={10} />)
    expect(screen.getByText('█'.repeat(3))).toBeTruthy()
    expect(screen.getByText('░'.repeat(7))).toBeTruthy()
  })

  it('rounds fractional percentage label (33.7% → 34%)', () => {
    render(<AsciiProgressBar label="Test" value={33.7} width={10} />)
    expect(screen.getByText('34%')).toBeTruthy()
  })
})
