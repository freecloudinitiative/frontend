import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LazySqlEditor } from '@/components/editor/LazySqlEditor'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LazySqlEditor', () => {
  it('retries with a fresh lazy component after the initial chunk load fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const LoadedEditor = () => <div>Recovered SQL editor</div>
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk unavailable'))
      .mockResolvedValueOnce({ default: LoadedEditor })

    render(<LazySqlEditor value="SELECT 1" onChange={() => {}} loader={loader} />)

    const retry = await screen.findByRole('button', { name: /Retry/i })
    expect(loader).toHaveBeenCalledTimes(1)

    fireEvent.click(retry)

    expect(await screen.findByText('Recovered SQL editor')).toBeInTheDocument()
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
