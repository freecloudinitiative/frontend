import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { resetBucketStore } from '@/mocks/data/buckets'
import { BucketCreateForm } from '@/features/storage/pages/BucketCreateForm'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetBucketStore()
})
afterAll(() => server.close())

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  const onSuccess = vi.fn()
  render(createElement(BucketCreateForm, { onCancel: vi.fn(), onSuccess }), { wrapper })
  return { onSuccess }
}

function fillName(name: string) {
  fireEvent.change(screen.getByLabelText('Bucket Name'), { target: { value: name } })
}

// TerminalSelect is a custom dropdown, not a native <select>: open it, then
// click the option by its visible label.
function chooseAccess(label: string) {
  fireEvent.click(screen.getByText('Access'))
  fireEvent.click(screen.getByText(label))
}

describe('BucketCreateForm — public-read-write acknowledgement', () => {
  // The API rejects public-read-write without confirmPublic. Before this
  // existed the form neither collected nor sent it, so that access level
  // could never be created: every attempt came back as a bare failure.
  it('sends confirmPublic once the acknowledgement is ticked', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('*/api/buckets', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 'b1', bucketName: body.bucketName }, { status: 201 })
      }),
    )

    const { onSuccess } = renderForm()
    fillName('test123')
    chooseAccess('Public read/write')
    fireEvent.click(screen.getByLabelText('Confirm public read/write'))
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(body).toMatchObject({ bucketName: 'test123', access: 'public-read-write', confirmPublic: true })
  })

  it('refuses to submit public-read-write until it is acknowledged', () => {
    server.use(
      http.post('*/api/buckets', () => {
        throw new Error('create must not be attempted without the acknowledgement')
      }),
    )

    renderForm()
    fillName('test123')
    chooseAccess('Public read/write')
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(screen.getByText(/anyone will be able to write/i)).toBeTruthy()
  })

  it('asks for nothing extra on the access levels that do not need it', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('*/api/buckets', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 'b1', bucketName: body.bucketName }, { status: 201 })
      }),
    )

    const { onSuccess } = renderForm()
    fillName('test123')
    chooseAccess('Public read')
    expect(screen.queryByLabelText('Confirm public read/write')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(body).not.toHaveProperty('confirmPublic')
  })
})
