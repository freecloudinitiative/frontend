import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGlobalSearch, type GlobalSearchDatasets } from '../useGlobalSearch'
import type { ComputeEngine } from '@/features/computeEngine/types'
import type { Database } from '@/features/database/types'
import type { IamUser } from '@/features/iam/types'
import type { Bucket } from '@/features/storage/types'
import type { Network } from '@/features/network/types'

const mockDatasets: GlobalSearchDatasets = {
  computeEngines: [
    {
      id: 'ce-1',
      name: 'web-prod-01',
      status: 'running',
      cpu: 4,
      memory: 8,
      disk: 100,
      diskType: 'SSD',
      ipAddress: '10.0.0.1',
      os: 'Ubuntu 22.04',
      region: 'ANK',
      zone: 'ank-1',
      createdAt: '2026-01-01',
    } as ComputeEngine,
    {
      id: 'ce-2',
      name: 'app-dev-01',
      status: 'stopped',
      cpu: 2,
      memory: 4,
      disk: 50,
      diskType: 'HDD',
      ipAddress: '10.0.0.2',
      os: 'Debian 11',
      region: 'IST',
      zone: 'ist-1',
      createdAt: '2026-01-02',
    } as ComputeEngine,
  ],
  databases: [
    {
      id: 'db-1',
      name: 'main-db-prod',
      engine: 'postgres',
      version: '15',
      status: 'running',
      cpu: 4,
      memory: 16,
      storageSize: 200,
      connectionString: 'postgresql://...',
      host: 'localhost',
      port: 5432,
      maxConnections: 100,
      activeConnections: 10,
      backupStatus: 'healthy',
      region: 'IST',
      zone: 'ist-1',
      createdAt: '2026-01-01',
    } as Database,
  ],
  iamUsers: [
    {
      id: 'iam-1',
      name: 'admin-user',
      email: 'admin@example.com',
      status: 'active',
      role: 'admin',
      lastLogin: '2026-01-01',
      region: 'ANK',
    } as unknown as IamUser,
  ],
  buckets: [
    {
      id: 'b-1',
      bucketName: 'prod-assets-bucket',
      totalSize: 1024,
      objectCount: 50,
      region: 'IST',
      status: 'active',
      access: 'public-read',
      createdAt: '2026-01-01',
    } as Bucket,
  ],
  networks: [
    {
      id: 'net-1',
      vpcName: 'main-vpc',
      cidrBlock: '10.0.0.0/16',
      type: 'vpc',
      status: 'active',
      gateway: '10.0.0.1',
      region: 'ANK',
      zone: 'ank-1',
      firewallRules: [],
      routes: [],
      peerings: [],
      subnets: [],
      createdAt: '2026-01-01',
    } as Network,
  ],
}

describe('useGlobalSearch hook', () => {
  it('returns empty array when query is empty string or whitespace', () => {
    const { result } = renderHook(() => useGlobalSearch(mockDatasets, ''))
    expect(result.current).toEqual([])

    const { result: spaces } = renderHook(() => useGlobalSearch(mockDatasets, '   '))
    expect(spaces.current).toEqual([])
  })

  it('filters resources by name across all services', () => {
    const { result } = renderHook(() => useGlobalSearch(mockDatasets, 'prod'))
    expect(result.current.length).toBe(3)
    const names = result.current.map((r) => r.name)
    expect(names).toContain('web-prod-01')
    expect(names).toContain('main-db-prod')
    expect(names).toContain('prod-assets-bucket')
  })

  it('filters by region, status, OS, role, or CIDR block', () => {
    const { result: ubuntuResult } = renderHook(() => useGlobalSearch(mockDatasets, 'Ubuntu'))
    expect(ubuntuResult.current.length).toBe(1)
    expect(ubuntuResult.current[0].name).toBe('web-prod-01')

    const { result: cidrResult } = renderHook(() => useGlobalSearch(mockDatasets, '10.0.0.0/16'))
    expect(cidrResult.current.length).toBe(1)
    expect(cidrResult.current[0].name).toBe('main-vpc')

    const { result: roleResult } = renderHook(() => useGlobalSearch(mockDatasets, 'admin'))
    expect(roleResult.current.length).toBe(1)
    expect(roleResult.current[0].name).toBe('admin-user')
  })

  it('ranks exact matches before partial matches', () => {
    const { result } = renderHook(() => useGlobalSearch(mockDatasets, 'main-vpc'))
    expect(result.current[0].name).toBe('main-vpc')
  })
})
