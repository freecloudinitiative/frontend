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

  it('filters subnet nodes by type when filter pills are clicked', () => {
    render(<NetworkMapTab selectedNetwork={mockNetwork} />)

    const privatePill = screen.getByRole('button', { name: /private \(1\)/i })
    fireEvent.click(privatePill)

    expect(screen.getAllByText('private-subnet-1').length).toBeGreaterThan(0)
    expect(screen.queryByText('public-subnet-1')).not.toBeInTheDocument()

    const allPill = screen.getByRole('button', { name: /all/i })
    fireEvent.click(allPill)

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
})
