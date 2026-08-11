/**
 * PR #21 — Test Scenario 6: Bucket Create Form
 * Field rendering, bucket-name validation (regex 6.2), successful submission (6.3),
 * cancel (6.4), and submission error (6.5).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { BucketCreateForm } from '@/features/storage/pages/BucketCreateForm'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderForm(onSuccess = vi.fn(), onCancel = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <BucketCreateForm onCancel={onCancel} onSuccess={onSuccess} />
    </QueryClientProvider>,
  )
  return { onSuccess, onCancel }
}

function nameInput() {
  return screen.getByLabelText('Bucket Name') as HTMLInputElement
}

describe('Scenario 6.1 — Form Fields', () => {
  it('renders Bucket Name, Region, Access, Create and Cancel', () => {
    renderForm()
    expect(screen.getByLabelText('Bucket Name')).toBeTruthy()
    expect(screen.getByText('Region')).toBeTruthy()
    expect(screen.getByText('Access')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
  })

  it('defaults Region to ANK and Access to Private', () => {
    renderForm()
    const selected = document.querySelectorAll('.fci-dd-selected')
    expect(Array.from(selected).map((el) => el.textContent)).toEqual(['ANK', 'Private'])
  })
})

describe('Scenario 6.2 — Bucket Name Validation', () => {
  it('6.2.1 — empty name is rejected, form does not submit', () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(document.querySelector('.fci-form-error')?.textContent).toMatch(/Bucket name is required/)
  })

  it('6.2.2 — uppercase name is rejected', () => {
    renderForm()
    fireEvent.change(nameInput(), { target: { value: 'MyBucket' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(document.querySelector('.fci-form-error')?.textContent).toMatch(/must be lowercase/)
  })

  it('6.2.3 — name with spaces is rejected', () => {
    renderForm()
    fireEvent.change(nameInput(), { target: { value: 'my bucket' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(document.querySelector('.fci-form-error')?.textContent).toMatch(/no spaces/)
  })

  it.each(['-mybucket', 'mybucket-', 'my_bucket'])(
    '6.2.4 — invalid regex name %s is rejected',
    (invalidName) => {
      renderForm()
      fireEvent.change(nameInput(), { target: { value: invalidName } })
      fireEvent.click(screen.getByRole('button', { name: 'Create' }))
      expect(nameInput().value).toBe(invalidName)
      expect(document.querySelector('.fci-form-error')?.textContent).toMatch(/lowercase, no spaces/)
    },
  )

  it.each(['my-bucket', 'backup-2026', 'app-data.prod'])(
    '6.2.4 — valid regex name %s passes client-side validation',
    async (validName) => {
      renderForm()
      fireEvent.change(nameInput(), { target: { value: validName } })
      fireEvent.click(screen.getByRole('button', { name: 'Create' }))
      expect(screen.queryByText(/lowercase, no spaces/)).toBeNull()
      await waitFor(() => expect(screen.getByText(/created successfully/)).toBeTruthy())
    },
  )
})

describe('Scenario 6.3 — Successful Submission', () => {
  it('submits valid input, disables the button while pending, then calls onSuccess', async () => {
    const { onSuccess } = renderForm()
    fireEvent.change(nameInput(), { target: { value: 'my-backup' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(screen.getByText(/created successfully/)).toBeTruthy()
  })
})

describe('Scenario 6.4 — Cancel', () => {
  it('calls onCancel and resets the form without submitting', () => {
    const { onCancel } = renderForm()
    fireEvent.change(nameInput(), { target: { value: 'my-backup' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe('Scenario 6.5 — Submission Error', () => {
  it('shows a server-side error and keeps the form for retry', async () => {
    server.use(
      http.post('*/api/buckets', () =>
        HttpResponse.json({ error: 'bucket name already exists' }, { status: 409 }),
      ),
    )
    const { onSuccess } = renderForm()
    fireEvent.change(nameInput(), { target: { value: 'already-taken' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(screen.getByText(/status code 409|Failed to create bucket/)).toBeTruthy())
    expect(onSuccess).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Create' })).not.toBeDisabled()
  })
})
