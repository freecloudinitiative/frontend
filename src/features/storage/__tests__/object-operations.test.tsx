import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { renderHook, waitFor, render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { getBuckets as getMockBuckets, resetBucketStore } from '@/mocks/data/buckets'
import {
  uploadObject,
  downloadObject,
  deleteObject,
  MAX_UPLOAD_BYTES,
} from '@/features/storage/api'
import {
  useUploadObject,
  useDownloadObject,
  useDeleteObject,
  storageKeys,
} from '@/features/storage/hooks'
import { BucketSettingsPage } from '@/features/storage/pages/BucketSettingsPage'
import { getApiErrorMessage } from '@/lib/apiError'
import apiClient from '@/lib/axios'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetBucketStore()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

function makeWrapper(queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('Storage Object Operations — API layer', () => {
  it('uploadObject sends PUT to the right path with the file as body', async () => {
    const bucketId = getMockBuckets()[0].id
    const file = new File(['test file content'], 'sample.txt', { type: 'text/plain' })

    let capturedUrl: string | undefined
    let capturedContentType: string | null = null

    server.use(
      http.put('*/api/buckets/:id/objects', async ({ request }) => {
        capturedUrl = request.url
        capturedContentType = request.headers.get('content-type')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const axiosPutSpy = vi.spyOn(apiClient, 'put')

    let progressCalled = false
    await uploadObject(bucketId, file, (pct) => {
      progressCalled = true
      expect(pct).toBeGreaterThanOrEqual(0)
    })
    expect(progressCalled).toBe(true)

    expect(capturedUrl).toContain(`/api/buckets/${bucketId}/objects`)
    expect(capturedUrl).toContain('key=sample.txt')
    expect(capturedContentType).toBe('text/plain')

    expect(axiosPutSpy).toHaveBeenCalledWith(
      `/api/buckets/${bucketId}/objects`,
      file,
      expect.objectContaining({
        params: { key: 'sample.txt' },
        headers: expect.objectContaining({
          'Content-Type': 'text/plain',
        }),
      }),
    )
  })

  it('a file over 12 MiB is rejected client-side with no request issued', async () => {
    const bucketId = getMockBuckets()[0].id
    const largeFile = new File([''], 'too-large.dat', { type: 'application/octet-stream' })
    // Mock the size property to exceed 12 MiB
    Object.defineProperty(largeFile, 'size', { value: MAX_UPLOAD_BYTES + 1024 })

    const putSpy = vi.fn()
    server.use(
      http.put('*/api/buckets/:id/objects', () => {
        putSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(uploadObject(bucketId, largeFile)).rejects.toThrow(/12 MiB/)
    expect(putSpy).not.toHaveBeenCalled()
  })

  it('downloadObject requests responseType "blob" and returns a Blob', async () => {
    const bucketId = getMockBuckets()[0].id
    const file = new File(['sample download data'], 'download-me.txt', { type: 'text/plain' })
    await uploadObject(bucketId, file)

    const axiosGetSpy = vi.spyOn(apiClient, 'get')

    const blob = await downloadObject(bucketId, 'download-me.txt')
    expect(blob).toBeInstanceOf(Blob)

    expect(axiosGetSpy).toHaveBeenCalledWith(
      `/api/buckets/${bucketId}/objects/content`,
      expect.objectContaining({
        params: { key: 'download-me.txt' },
        responseType: 'blob',
      }),
    )
  })

  it('deleteObject sends DELETE to the objects endpoint with key in query', async () => {
    const bucketId = getMockBuckets()[0].id
    let capturedUrl: string | undefined

    server.use(
      http.delete('*/api/buckets/:id/objects', ({ request }) => {
        capturedUrl = request.url
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await deleteObject(bucketId, 'sample-key.txt')
    expect(capturedUrl).toContain(`/api/buckets/${bucketId}/objects`)
    expect(capturedUrl).toContain('key=sample-key.txt')
  })
})

describe('Storage Object Operations — React Query Hooks & Invalidation', () => {
  it('useUploadObject invalidates both files and metrics query keys on success', async () => {
    const bucketId = getMockBuckets()[0].id
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUploadObject(bucketId), {
      wrapper: makeWrapper(queryClient),
    })

    const file = new File(['upload data'], 'new-file.txt', { type: 'text/plain' })
    result.current.mutate({ file })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: storageKeys.files(bucketId),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: storageKeys.metrics(bucketId),
    })
  })

  it('deleteObject invalidates both files and metrics query keys', async () => {
    const bucketId = getMockBuckets()[0].id
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteObject(bucketId), {
      wrapper: makeWrapper(queryClient),
    })

    // First upload a file to ensure it exists in mock data
    const file = new File(['temp'], 'del-test.txt', { type: 'text/plain' })
    await uploadObject(bucketId, file)

    result.current.mutate('del-test.txt')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: storageKeys.files(bucketId),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: storageKeys.metrics(bucketId),
    })
  })

  it('useDownloadObject executes download and returns Blob', async () => {
    const bucketId = getMockBuckets()[0].id
    const { result } = renderHook(() => useDownloadObject(bucketId), {
      wrapper: makeWrapper(),
    })

    // Upload first to ensure key exists
    const file = new File(['downloadable data'], 'download-test.txt', { type: 'text/plain' })
    await uploadObject(bucketId, file)

    result.current.mutate('download-test.txt')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeInstanceOf(Blob)
  })
})

describe('Storage Object Operations — Error Handling & 413 Responses', () => {
  it('a 413 surfaces a message naming the size limit', async () => {
    const bucketId = getMockBuckets()[0].id

    server.use(
      http.put('*/api/buckets/:id/objects', () => {
        return HttpResponse.json(
          {
            error: {
              code: 'invalid_input',
              message: 'upload exceeds the maximum allowed size of 12 MiB',
              request_id: 'msw-test-413',
            },
          },
          { status: 413 },
        )
      }),
    )

    const smallFile = new File(['test'], 'small.txt', { type: 'text/plain' })

    let caughtError: unknown
    try {
      await uploadObject(bucketId, smallFile)
    } catch (err) {
      caughtError = err
    }

    expect(caughtError).toBeDefined()
    const message = getApiErrorMessage(caughtError, 'Fallback error')
    expect(message).toContain('12 MiB')
  })

  it('GET /api/buckets/:id/objects/content returns 404 for nonexistent key', async () => {
    const bucketId = getMockBuckets()[0].id
    await expect(downloadObject(bucketId, 'non-existent-key-12345.xyz')).rejects.toThrow()
  })

  it('DELETE /api/buckets/:id/objects returns 404 for nonexistent key', async () => {
    const bucketId = getMockBuckets()[0].id
    await expect(deleteObject(bucketId, 'non-existent-key-12345.xyz')).rejects.toThrow()
  })
})

describe('BucketSettingsPage — Object Browser UI Integration', () => {
  it('renders objects table and allows downloading and deleting files with confirmation', async () => {
    const bucketId = getMockBuckets()[0].id
    const handleBack = vi.fn()

    render(
      <BucketSettingsPage onBack={handleBack} selectedRowId={bucketId} />,
      { wrapper: makeWrapper() },
    )

    expect(screen.getByText('Bucket Objects')).toBeInTheDocument()

    // Wait for files to load
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Download/i }).length).toBeGreaterThan(0)
    })

    // Find delete buttons
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
    expect(deleteButtons.length).toBeGreaterThan(0)

    // Click first delete button to enter confirmation
    fireEvent.click(deleteButtons[0])
    expect(screen.getByText('Confirm?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirm delete/i })).toBeInTheDocument()

    // Click No to cancel
    fireEvent.click(screen.getByRole('button', { name: /Cancel delete/i }))
    expect(screen.queryByText('Confirm?')).toBeNull()
  })

  it('shows error when selecting file over 12 MiB in BucketSettingsPage', async () => {
    const bucketId = getMockBuckets()[0].id
    const handleBack = vi.fn()

    const { container } = render(
      <BucketSettingsPage onBack={handleBack} selectedRowId={bucketId} />,
      { wrapper: makeWrapper() },
    )

    const fileInput = container.querySelector('#bucket-object-file-input') as HTMLInputElement
    expect(fileInput).toBeTruthy()

    const largeFile = new File([''], 'huge-movie.mp4', { type: 'video/mp4' })
    Object.defineProperty(largeFile, 'size', { value: MAX_UPLOAD_BYTES + 1024 * 1024 })

    fireEvent.change(fileInput, { target: { files: [largeFile] } })

    expect(await screen.findByText(/exceeds the 12 MiB upload limit/i)).toBeInTheDocument()
  })
})
