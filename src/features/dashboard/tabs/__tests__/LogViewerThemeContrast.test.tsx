import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DatabaseTabContent } from '../DatabaseTabContent'
import { IamTabContent } from '../IamTabContent'

describe('Log Viewer Theme-Aware Contrast & Readability', () => {
  it('renders Recent Log Entries with theme-aware fci-log CSS classes in DatabaseTabContent', () => {
    const { container } = render(<DatabaseTabContent tab="logs" selectedDatabaseId="db-1" />)

    const logContainer = container.querySelector('.fci-console-log')
    expect(logContainer).toBeInTheDocument()

    const infoBadges = container.querySelectorAll('.fci-log-info')
    expect(infoBadges.length).toBeGreaterThan(0)

    const warnBadges = container.querySelectorAll('.fci-log-warn')
    expect(warnBadges.length).toBeGreaterThan(0)

    const errorBadges = container.querySelectorAll('.fci-log-error')
    expect(errorBadges.length).toBeGreaterThan(0)

    const timestamps = container.querySelectorAll('.fci-log-timestamp')
    expect(timestamps.length).toBeGreaterThan(0)

    expect(screen.getByText('Recent Log Entries')).toBeInTheDocument()
    expect(screen.getByText(/autovacuum: table "prod_db.public.events"/i)).toBeInTheDocument()
  })

  it('renders Recent Activity log entries with semantic theme-aware fci-log CSS classes in IamTabContent', () => {
    const { container } = render(<IamTabContent tab="activity" iamUserWithPolicies={null} />)

    const logContainer = container.querySelector('.fci-console-log')
    expect(logContainer).toBeInTheDocument()

    const infoBadges = container.querySelectorAll('.fci-log-info')
    expect(infoBadges.length).toBeGreaterThan(0)

    const timestamps = container.querySelectorAll('.fci-log-timestamp')
    expect(timestamps.length).toBeGreaterThan(0)

    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getAllByText(/Login/i).length).toBeGreaterThan(0)
  })
})
