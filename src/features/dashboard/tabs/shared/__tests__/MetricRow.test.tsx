/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §4.7, §7.11
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricRow } from '../MetricRow'

describe('MetricRow', () => {
  it('renders the section title and one row per item, in order', () => {
    render(
      <MetricRow
        title="SSH Access"
        items={[
          { label: 'Host', value: '10.128.0.12', color: 'var(--dash-label)' },
          { label: 'Port', value: '22', color: 'var(--dash-label)' },
        ]}
      />,
    )
    expect(screen.getByText('SSH Access')).toBeInTheDocument()
    expect(screen.getByText('10.128.0.12')).toBeInTheDocument()
    expect(screen.getByText('22')).toBeInTheDocument()
  })

  it('applies the per-item color to each value span', () => {
    render(<MetricRow title="Disk I/O" items={[{ label: 'Read', value: '142 MB/s', color: '#7ec87e' }]} />)
    expect(screen.getByText('142 MB/s')).toHaveStyle({ color: 'rgb(126, 200, 126)' })
  })

  it('does not mix items from separate MetricRow instances rendered side by side', () => {
    render(
      <>
        <MetricRow title="Traffic" items={[{ label: 'Ingress', value: '142 Mbps', color: 'var(--dash-label)' }]} />
        <MetricRow title="Pool Stats" items={[{ label: 'Max conn', value: '200', color: 'var(--dash-label)' }]} />
      </>,
    )
    expect(screen.getByText('Traffic')).toBeInTheDocument()
    expect(screen.getByText('142 Mbps')).toBeInTheDocument()
    expect(screen.getByText('Pool Stats')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.queryByText('Max conn: 142 Mbps')).not.toBeInTheDocument()
  })
})
