import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccount } from '@/features/account/api'

const apiClient = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/lib/axios', () => ({ default: apiClient }))

describe('account API', () => {
  beforeEach(() => {
    apiClient.get.mockReset()
  })

  it('bounds the account settings request so session timeout fallback can activate', async () => {
    apiClient.get.mockResolvedValue({ data: { sessionTimeoutMinutes: 60 } })

    await expect(getAccount()).resolves.toEqual({ sessionTimeoutMinutes: 60 })
    expect(apiClient.get).toHaveBeenCalledWith('/api/account', { timeout: 15_000 })
  })
})
