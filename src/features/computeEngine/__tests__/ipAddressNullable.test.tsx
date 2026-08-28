import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ComputeEngineDetailPage } from '@/features/computeEngine/pages/ComputeEngineDetailPage'

const pendingComputeEngine = vi.hoisted(() => ({
  id: 'ce-pending',
  name: 'pending-worker-01',
  status: 'pending' as const,
  cpu: 2,
  memory: 4,
  disk: 50,
  diskType: 'SSD' as const,
  ipAddress: null,
  os: 'Ubuntu 24.04',
  region: 'IST' as const,
  zone: 'ist-1',
  instanceType: 'shared',
  autoBackups: false,
  createdAt: '2026-08-28T12:00:00.000Z',
}))

vi.mock('@/features/computeEngine/hooks', () => ({
  useComputeEngine: () => ({
    data: pendingComputeEngine,
    isLoading: false,
    isError: false,
  }),
  useDeleteComputeEngine: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  }),
}))

describe('nullable Compute Engine IP address', () => {
  it('renders a pending engine with an unassigned address as a placeholder', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/ce-pending']}>
        <Routes>
          <Route path="/:id" element={<ComputeEngineDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const ipLabel = screen.getByText('IP Address')
    expect(ipLabel.nextElementSibling).toHaveTextContent('—')
    expect(container.textContent).not.toContain('null')
  })
})
