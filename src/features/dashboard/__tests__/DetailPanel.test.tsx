import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DetailPanel } from '@/features/dashboard/DetailPanel'
import type { IamUser, IamUserWithPolicies } from '@/features/iam/types'
import type { Bucket } from '@/features/storage/types'
import type { Network } from '@/features/network/types'

const mockIamUser: IamUser = {
  id: 'usr-1',
  name: 'admin-user',
  email: 'admin@tui.cloud',
  status: 'active',
  role: 'admin',
  lastLogin: '2026-08-10T12:00:00Z',
  mfaEnabled: true,
  region: 'IST',
  zone: 'ist-1a',
  createdAt: '2026-01-01T00:00:00Z',
}

const mockIamUserWithPolicies: IamUserWithPolicies = {
  ...mockIamUser,
  policies: [
    {
      id: 'pol-1',
      userId: 'usr-1',
      name: 'AdministratorAccess',
      type: 'managed',
      attachedAt: '2026-01-02T10:00:00Z',
      status: 'active',
      permissions: [],
    },
    {
      id: 'pol-2',
      userId: 'usr-1',
      name: 'CustomSecurityPolicy',
      type: 'custom',
      attachedAt: '2026-02-15T14:00:00Z',
      status: 'review-needed',
      permissions: [],
    },
  ],
}

const mockComputeEngine = {
  id: 'ce-101',
  name: 'prod-web-01',
  os: 'Ubuntu 22.04 LTS',
  region: 'IST',
  status: 'running',
  type: 'c5.large',
  ip: '192.168.1.10',
  ipAddress: '192.168.1.10',
  cpu: 4,
  memory: 16,
  memoryGB: 16,
  disk: 100,
  diskGB: 100,
  diskType: 'gp3',
  network: 'vpc-main',
  tags: ['prod', 'web'],
  createdAt: '2026-03-01T00:00:00Z',
} as any

const mockDatabase = {
  id: 'db-202',
  name: 'main-postgres',
  region: 'IST',
  status: 'available',
  engine: 'postgres',
  version: '15.2',
  endpoint: 'main-postgres.db.internal',
  host: 'main-postgres.db.internal',
  port: 5432,
  connectionString: 'postgresql://root:password@main-postgres.db.internal:5432/main-postgres',
  storageSize: 200,
  cpu: 8,
  memory: 32,
  connectionsCount: 42,
  maxConnections: 100,
  createdAt: '2026-04-01T00:00:00Z',
} as any

const mockBucket: Bucket = {
  id: 'bkt-303',
  bucketName: 'app-assets-bucket',
  totalSize: 1073741824,
  objectCount: 1420,
  region: 'IST',
  zone: 'ist-1a',
  access: 'private',
  versioning: true,
  lifecycleEnabled: true,
  status: 'active',
  createdAt: '2026-05-01T00:00:00Z',
}

const mockNetwork: Network = {
  id: 'net-404',
  vpcName: 'vpc-primary',
  cidrBlock: '10.0.0.0/16',
  type: 'vpc',
  status: 'active',
  gateway: '10.0.0.1',
  region: 'IST',
  zone: 'ist-1a',
  firewallRules: [],
  routes: [],
  peerings: [],
  createdAt: '2026-06-01T00:00:00Z',
}

describe('DetailPanel component', () => {
  const defaultProps = {
    activeService: 'IAM' as const,
    activeTab: 'details' as const,
    isMobile: false,
    showDetail: true,
    setShowDetail: vi.fn(),
    setSelectedRowId: vi.fn(),
    selectTab: vi.fn(),
    selectedRowId: 'usr-1',
    selectedRow: mockIamUser as any,
    selectedComputeEngine: null,
    selectedDatabase: null,
    selectedIamUser: mockIamUser,
    selectedIamUserWithPolicies: mockIamUserWithPolicies,
    selectedBucket: null,
    selectedNetwork: null,
    copyState: 'copy' as const,
    copyConnectionString: vi.fn(),
  }

  it('renders IAM user info and policies table via TanStack React Table', () => {
    render(<DetailPanel {...defaultProps} />)

    expect(screen.getByText('admin-user')).toBeDefined()
    expect(screen.getByText('Account')).toBeDefined()
    expect(screen.getAllByText('Policies').length).toBeGreaterThanOrEqual(1)

    // Table column headers
    expect(screen.getByRole('button', { name: /Policy Name/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Type/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Attached At/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Status/i })).toBeDefined()

    // Policy rows content
    expect(screen.getByText('AdministratorAccess')).toBeDefined()
    expect(screen.getByText('Managed')).toBeDefined()
    expect(screen.getByText('CustomSecurityPolicy')).toBeDefined()
    expect(screen.getByText('Custom')).toBeDefined()
    expect(screen.getByText('Review needed')).toBeDefined()
  })

  it('sorts policies when clicking table header buttons', () => {
    render(<DetailPanel {...defaultProps} />)

    const typeHeader = screen.getByRole('button', { name: /Type/i })
    fireEvent.click(typeHeader)

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0].textContent).toContain('Custom')
  })

  it('displays empty message when user has no policies attached', () => {
    const noPoliciesUser: IamUserWithPolicies = {
      ...mockIamUserWithPolicies,
      policies: [],
    }

    render(
      <DetailPanel
        {...defaultProps}
        selectedIamUserWithPolicies={noPoliciesUser}
      />,
    )

    expect(screen.getByText('No policies attached.')).toBeDefined()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('renders Compute Engine detail panel when activeService is Compute Engine', () => {
    render(
      <DetailPanel
        {...defaultProps}
        activeService="Compute Engine"
        selectedRowId="ce-101"
        selectedComputeEngine={mockComputeEngine}
        selectedIamUser={null}
        selectedIamUserWithPolicies={null}
      />,
    )

    expect(screen.getByText('prod-web-01')).toBeDefined()
    expect(screen.getByText('Ubuntu 22.04 LTS')).toBeDefined()
    expect(screen.getByText('192.168.1.10')).toBeDefined()
  })

  it('renders Database detail panel and calls copyConnectionString on click', () => {
    const handleCopy = vi.fn()
    render(
      <DetailPanel
        {...defaultProps}
        activeService="Database"
        selectedRowId="db-202"
        selectedDatabase={mockDatabase}
        selectedIamUser={null}
        selectedIamUserWithPolicies={null}
        copyConnectionString={handleCopy}
      />,
    )

    expect(screen.getByText('main-postgres')).toBeDefined()
    expect(screen.getByText('postgres 15.2')).toBeDefined()

    const copyBtn = screen.getByRole('button', { name: /Copy/i })
    fireEvent.click(copyBtn)
    expect(handleCopy).toHaveBeenCalledWith('postgresql://root:password@main-postgres.db.internal:5432/main-postgres')
  })

  it('renders Storage bucket details when activeService is Storage', () => {
    render(
      <DetailPanel
        {...defaultProps}
        activeService="Storage"
        selectedRowId="bkt-303"
        selectedBucket={mockBucket}
        selectedIamUser={null}
        selectedIamUserWithPolicies={null}
      />,
    )

    expect(screen.getByText('app-assets-bucket')).toBeDefined()
    expect(screen.getByText('Private')).toBeDefined()
  })

  it('renders Network details when activeService is Network', () => {
    render(
      <DetailPanel
        {...defaultProps}
        activeService="Network"
        selectedRowId="net-404"
        selectedNetwork={mockNetwork}
        selectedIamUser={null}
        selectedIamUserWithPolicies={null}
      />,
    )

    expect(screen.getByText('vpc-primary')).toBeDefined()
    expect(screen.getByText('10.0.0.0/16')).toBeDefined()
  })

  it('triggers selectTab when tab headers are clicked', () => {
    const handleSelectTab = vi.fn()
    render(<DetailPanel {...defaultProps} selectTab={handleSelectTab} />)

    const permissionsTab = screen.getByRole('tab', { name: 'Permissions' })
    fireEvent.click(permissionsTab)
    expect(handleSelectTab).toHaveBeenCalledWith('permissions')
  })

  it('handles mobile back button click to reset selection and hide detail', () => {
    const handleSetShowDetail = vi.fn()
    const handleSetSelectedRowId = vi.fn()

    render(
      <DetailPanel
        {...defaultProps}
        isMobile={true}
        showDetail={true}
        setShowDetail={handleSetShowDetail}
        setSelectedRowId={handleSetSelectedRowId}
      />,
    )

    const backBtn = screen.getByLabelText('Back to list')
    fireEvent.click(backBtn)

    expect(handleSetShowDetail).toHaveBeenCalledWith(false)
    expect(handleSetSelectedRowId).toHaveBeenCalledWith(null)
  })
})
