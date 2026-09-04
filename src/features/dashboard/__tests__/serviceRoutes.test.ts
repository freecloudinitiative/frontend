import { describe, expect, it } from 'vitest'
import { isInstanceScopedTab, serviceResourcePath, serviceTabPath } from '@/features/dashboard/serviceRoutes'

describe('instance-scoped service routes', () => {
  it('keeps service-level tabs free of a resource id', () => {
    expect(isInstanceScopedTab('info')).toBe(false)
    expect(isInstanceScopedTab('create')).toBe(false)
    expect(serviceTabPath('database', 'info', 'db-1')).toBe('/services/database/info')
    expect(serviceTabPath('database', 'create', 'db-1')).toBe('/services/database/create')
  })

  it('includes the encoded resource id for instance tabs', () => {
    expect(serviceTabPath('database', 'connections', 'db/one')).toBe(
      '/services/database/db%2Fone/connections',
    )
    expect(serviceResourcePath('storage', 'bucket-1', 'objects')).toBe(
      '/services/storage/bucket-1/objects',
    )
  })

  it('defaults resource links to the details tab', () => {
    expect(serviceResourcePath('network', 'net-1')).toBe('/services/network/net-1/details')
  })
})
