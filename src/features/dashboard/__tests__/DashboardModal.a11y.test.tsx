/**
 * DashboardModal — automated axe-core accessibility tests (PR #37)
 *
 * Renders the modal in its open state and asserts zero critical/serious
 * axe violations on the portal-rendered markup.
 */
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { DashboardModal } from '@/features/dashboard/DashboardModal'

describe('DashboardModal — axe a11y audit', () => {
  it('has zero critical/serious axe violations when open', async () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Delete Confirmation">
        <p>Are you sure you want to delete this resource?</p>
        <button type="button">Confirm</button>
        <button type="button">Cancel</button>
      </DashboardModal>,
    )
    // The modal renders via portal into document.body
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()
  })

  it('has zero violations with form content inside the modal', async () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Edit Settings">
        <label htmlFor="setting-name">Name</label>
        <input id="setting-name" type="text" defaultValue="test" />
        <button type="button">Save</button>
      </DashboardModal>,
    )
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()
  })
})
