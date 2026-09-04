/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §4.1, §7.8
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BackupHistoryTable } from '../BackupHistoryTable'

describe('BackupHistoryTable', () => {
  it('renders the same 4 mock backup rows (bkp-001..bkp-004)', () => {
    render(<BackupHistoryTable />)
    for (const id of ['bkp-001', 'bkp-002', 'bkp-003', 'bkp-004']) {
      expect(screen.getByText(id)).toBeInTheDocument()
    }
  })

  it('renders the Backup History header, table columns, and Policy metric row', () => {
    render(<BackupHistoryTable />)
    expect(screen.getByText('Backup History')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('table')).toHaveClass('fci-detail-table')
    expect(screen.getByText('Policy')).toBeInTheDocument()
    expect(screen.getByText('Daily 02:00 UTC')).toBeInTheDocument()
    expect(screen.getByText('AES-256')).toBeInTheDocument()
  })

  it('produces byte-for-byte identical output on repeated renders (Compute Engine and Database both render it with identical props)', () => {
    const first = render(<BackupHistoryTable />)
    const second = render(<BackupHistoryTable />)
    expect(second.container.innerHTML).toBe(first.container.innerHTML)
  })
})
