import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { NetworkMapTab } from '../NetworkMapTab'
import type { Network } from '@/features/network/types'

const mockNetwork: Network = {
  id: 'net-1',
  vpcName: 'test-vpc-01',
  cidrBlock: '10.0.0.0/16',
  type: 'vpc',
  status: 'active',
  gateway: '10.0.0.1',
  region: 'IST',
  zone: 'ist-1',
  firewallRules: [],
  routes: [],
  peerings: [],
  subnets: [
    {
      id: 'sub-1',
      name: 'public-subnet-1',
      cidrBlock: '10.0.1.0/24',
      type: 'public',
      zone: 'ist-1',
      gateway: '10.0.1.1',
      status: 'active',
      resourceCount: 4,
    },
    {
      id: 'sub-2',
      name: 'private-subnet-1',
      cidrBlock: '10.0.2.0/24',
      type: 'private',
      zone: 'ist-1',
      gateway: '10.0.2.1',
      status: 'active',
      resourceCount: 6,
    },
  ],
  createdAt: new Date().toISOString(),
}

describe('NetworkMapTab', () => {
  it('renders fallback message when no network is selected', () => {
    render(<NetworkMapTab selectedNetwork={null} />)
    expect(screen.getByText(/Select a network to view its Network Map/i)).toBeInTheDocument()
  })

  it('renders VPC node and subnet nodes when network is provided', () => {
    render(<NetworkMapTab selectedNetwork={mockNetwork} />)

    expect(screen.getAllByText('test-vpc-01').length).toBeGreaterThan(0)
    expect(screen.getByText(/CIDR: 10.0.0.0\/16/i)).toBeInTheDocument()
    expect(screen.getAllByText('public-subnet-1').length).toBeGreaterThan(0)
    expect(screen.getByText('private-subnet-1')).toBeInTheDocument()
    expect(screen.getAllByText('10.0.1.0/24').length).toBeGreaterThan(0)
    expect(screen.getByText('10.0.2.0/24')).toBeInTheDocument()
  })

  it('filters subnet nodes by type when filter pills are clicked and updates aria-pressed', () => {
    render(<NetworkMapTab selectedNetwork={mockNetwork} />)

    const allPill = screen.getByRole('button', { name: /all/i })
    const privatePill = screen.getByRole('button', { name: /private \(1\)/i })
    const publicPill = screen.getByRole('button', { name: /public \(1\)/i })

    expect(allPill.getAttribute('aria-pressed')).toBe('true')
    expect(privatePill.getAttribute('aria-pressed')).toBe('false')

    // Select public subnet first
    const publicSubnetCard = screen.getAllByText('public-subnet-1')[0]
    fireEvent.click(publicSubnetCard)
    expect(screen.getByText(/Subnet Details —/i)).toBeInTheDocument()
    expect(screen.getByText(/Subnet CIDR:/i).parentElement?.textContent).toContain('10.0.1.0/24')

    // Switch filter to private
    fireEvent.click(privatePill)
    expect(privatePill.getAttribute('aria-pressed')).toBe('true')
    expect(allPill.getAttribute('aria-pressed')).toBe('false')

    expect(screen.getAllByText('private-subnet-1').length).toBeGreaterThan(0)
    expect(screen.queryByText('public-subnet-1')).not.toBeInTheDocument()

    // Inspector should automatically fall back to the first subnet matching active filter (private-subnet-1)
    expect(screen.getByText(/Subnet CIDR:/i).parentElement?.textContent).toContain('10.0.2.0/24')

    // Switch back to all
    fireEvent.click(allPill)
    expect(allPill.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByText('public-subnet-1').length).toBeGreaterThan(0)
    expect(screen.getByText('private-subnet-1')).toBeInTheDocument()
  })

  it('selects a subnet node when clicked and displays inspector details', () => {
    render(<NetworkMapTab selectedNetwork={mockNetwork} />)

    const privateSubnetCard = screen.getByText('private-subnet-1')
    fireEvent.click(privateSubnetCard)

    expect(screen.getByText(/Subnet Details —/i)).toBeInTheDocument()
    expect(screen.getAllByText('private-subnet-1').length).toBeGreaterThan(0)
  })

  it('supports keyboard navigation and Enter/Space activation on subnet cards', () => {
    render(<NetworkMapTab selectedNetwork={mockNetwork} />)

    const subnetButtons = screen.getAllByRole('button', { name: /subnet-1/i })
    expect(subnetButtons.length).toBeGreaterThan(0)

    const publicCard = subnetButtons[0]
    expect(publicCard.getAttribute('tabindex')).toBe('0')
    expect(publicCard.getAttribute('aria-pressed')).toBe('true')

    const privateCard = subnetButtons[1]
    expect(privateCard.getAttribute('aria-pressed')).toBe('false')

    // Activate private card via Enter key
    fireEvent.keyDown(privateCard, { key: 'Enter' })
    expect(privateCard.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText(/Subnet Details —/i)).toBeInTheDocument()

    // Activate public card via Space key
    fireEvent.keyDown(publicCard, { key: ' ' })
    expect(publicCard.getAttribute('aria-pressed')).toBe('true')
  })
})
