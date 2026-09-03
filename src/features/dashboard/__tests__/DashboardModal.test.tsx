import { afterAll, afterEach, beforeAll, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { DashboardModal } from '@/features/dashboard/DashboardModal'
import { DashboardModalBody } from '@/features/dashboard/DashboardModalBody'
import { MAX_UPLOAD_BYTES } from '@/features/storage/api'
import { server } from '@/test/server'
import { useToastStore } from '@/store/toastStore'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  useToastStore.setState({ toasts: [] })
})
afterAll(() => server.close())

describe('DashboardModal', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <DashboardModal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Modal Content</div>
      </DashboardModal>,
    )
    expect(screen.queryByText('Test Modal')).toBeNull()
    expect(screen.queryByText('Modal Content')).toBeNull()
  })

  it('renders title and children in a portal when isOpen is true', () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Confirm Action">
        <p>Are you sure?</p>
      </DashboardModal>,
    )
    expect(screen.getByText('Confirm Action')).toBeTruthy()
    expect(screen.getByText('Are you sure?')).toBeTruthy()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('has role="dialog" and aria-modal="true"', () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Modal Title">
        <button type="button">Inside Button</button>
      </DashboardModal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('calls onClose when close button (✕) is clicked', () => {
    const handleClose = vi.fn()
    render(
      <DashboardModal isOpen={true} onClose={handleClose} title="Close Test">
        <div>Body</div>
      </DashboardModal>,
    )
    const closeBtn = screen.getByLabelText('Close')
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking overlay background', () => {
    const handleClose = vi.fn()
    render(
      <DashboardModal isOpen={true} onClose={handleClose} title="Overlay Test">
        <div>Body</div>
      </DashboardModal>,
    )
    const overlay = screen.getByRole('dialog')
    fireEvent.click(overlay)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onClose when clicking inside the modal box content', () => {
    const handleClose = vi.fn()
    render(
      <DashboardModal isOpen={true} onClose={handleClose} title="Box Test">
        <button type="button">Inside</button>
      </DashboardModal>,
    )
    const insideBtn = screen.getByText('Inside')
    fireEvent.click(insideBtn)
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn()
    render(
      <DashboardModal isOpen={true} onClose={handleClose} title="Escape Test">
        <div>Body</div>
      </DashboardModal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('initial focus capture: automatically focuses the first focusable element inside the modal', () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Focus Test">
        <input type="text" placeholder="First Input" />
        <button type="button">Second Button</button>
      </DashboardModal>,
    )
    const closeBtn = screen.getByLabelText('Close')
    expect(document.activeElement).toBe(closeBtn)
  })

  it('forward focus trapping (Tab from last focusable element wraps to first)', () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Trap Test">
        <button type="button" id="btn-inside">Inside Button</button>
      </DashboardModal>,
    )
    const closeBtn = screen.getByLabelText('Close')
    const insideBtn = screen.getByRole('button', { name: 'Inside Button' })

    insideBtn.focus()
    expect(document.activeElement).toBe(insideBtn)

    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: false })
    expect(document.activeElement).toBe(closeBtn)
  })

  it('backward focus trapping (Shift+Tab from first focusable element wraps to last)', () => {
    render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Shift Tab Test">
        <button type="button" id="btn-inside">Inside Button</button>
      </DashboardModal>,
    )
    const closeBtn = screen.getByLabelText('Close')
    const insideBtn = screen.getByRole('button', { name: 'Inside Button' })

    closeBtn.focus()
    expect(document.activeElement).toBe(closeBtn)

    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(insideBtn)
  })

  it('focus restoration: returns focus to invoking element when modal closes', () => {
    const invoker = document.createElement('button')
    invoker.textContent = 'Open Modal'
    document.body.appendChild(invoker)
    invoker.focus()
    expect(document.activeElement).toBe(invoker)

    const { unmount } = render(
      <DashboardModal isOpen={true} onClose={() => {}} title="Restore Test">
        <button type="button">Inside</button>
      </DashboardModal>,
    )

    unmount()
    expect(document.activeElement).toBe(invoker)
    document.body.removeChild(invoker)
  })
})

describe('DashboardModalBody - storage-upload', () => {
  function renderUploadModal(closeModal = vi.fn()) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const result = render(
      <QueryClientProvider client={queryClient}>
        <DashboardModalBody
          modalAction="storage-upload"
          selectedComputeEngine={null}
          selectedDatabase={null}
          selectedIamUser={null}
          selectedBucket={{
            id: 'b1',
            bucketName: 'my-test-bucket',
            region: 'IST',
            zone: 'ist-1',
            access: 'private',
            totalSize: 100,
            objectCount: 2,
            versioning: false,
            lifecycleEnabled: false,
            status: 'active',
            createdAt: '2024-01-01',
          }}
          selectedNetwork={null}
          deleteError={null}
          iamActionError={null}
          copyState="copy"
          copyConnectionString={() => {}}
          closeModal={closeModal}
          confirmModalAction={() => {}}
          modalIsPending={false}
          iamEditRole="viewer"
          setIamEditRole={() => {}}
        />
      </QueryClientProvider>,
    )
    return { ...result, closeModal }
  }

  it('uploads the selected file through the storage API and closes on success', async () => {
    const handleClose = vi.fn()
    let requestUrl = ''
    let releaseUpload!: () => void
    const uploadGate = new Promise<void>((resolve) => { releaseUpload = resolve })
    server.use(
      http.put('*/api/buckets/:id/objects', async ({ request }) => {
        requestUrl = request.url
        await uploadGate
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { container } = renderUploadModal(handleClose)

    const fileInput = container.querySelector('#fci-file-upload-input') as HTMLInputElement
    expect(fileInput).toBeTruthy()
    expect(fileInput.disabled).toBe(false)

    const file = new File(['pdf contents'], 'report.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    const uploadBtn = screen.getByRole('button', { name: 'Upload File' })
    expect(uploadBtn).toBeTruthy()
    expect(uploadBtn.getAttribute('disabled')).toBeNull()

    fireEvent.click(uploadBtn)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Uploading…' })).toBeDisabled())
    expect(fileInput).toBeDisabled()
    expect(requestUrl).toContain('/api/buckets/b1/objects')
    expect(requestUrl).toContain('key=report.pdf')

    releaseUpload()
    await waitFor(() => expect(handleClose).toHaveBeenCalledTimes(1))
    expect(useToastStore.getState().toasts.at(-1)?.message).toContain('report.pdf')
  })

  it('rejects files over the upload limit before issuing a request', () => {
    const requestSpy = vi.fn()
    server.use(
      http.put('*/api/buckets/:id/objects', () => {
        requestSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { container } = renderUploadModal()
    const fileInput = container.querySelector('#fci-file-upload-input') as HTMLInputElement
    const file = new File([''], 'large.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: MAX_UPLOAD_BYTES + 1 })

    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(screen.getByRole('alert')).toHaveTextContent('exceeds the 12 MiB upload limit')
    expect(screen.getByRole('button', { name: 'Upload File' })).toBeDisabled()
    expect(requestSpy).not.toHaveBeenCalled()
  })
})
