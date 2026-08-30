import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { renderHook, waitFor, render, screen, fireEvent, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server, waitForPendingRequests } from '@/test/server'
import { getBuckets as getMockBuckets, resetBucketStore, getAccessPoliciesForBucket } from '@/mocks/data/buckets'
import {
  createBucketAccessPolicy,
  deleteBucketAccessPolicy,
} from '@/features/storage/api'
import {
  useCreateBucketAccessPolicy,
  useDeleteBucketAccessPolicy,
  storageKeys,
} from '@/features/storage/hooks'
import { BucketSettingsPage } from '@/features/storage/pages/BucketSettingsPage'
import type { BucketAccessPermission } from '@/features/storage/types'
import apiClient from '@/lib/axios'
import { BUCKET_POLICY_PRINCIPAL_PATTERN } from '@/lib/apiConstraints'

const queryClients = new Set<QueryClient>()
const USER_PRINCIPAL = 'user:123e4567-e89b-12d3-a456-426614174000'
const ACCOUNT_PRINCIPAL = 'account:123e4567-e89b-12d3-a456-426614174001'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(async () => {
  await Promise.all(Array.from(queryClients, (queryClient) => queryClient.cancelQueries()))
  queryClients.forEach((queryClient) => queryClient.clear())
  queryClients.clear()
  await waitForPendingRequests()
  server.resetHandlers()
  resetBucketStore()
  vi.restoreAllMocks()
})
afterAll(async () => {
  await waitForPendingRequests()
  server.close()
})

function makeWrapper(queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})) {
  queryClients.add(queryClient)
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

// ---------------------------------------------------------------------------
// API layer — body shape
// ---------------------------------------------------------------------------

describe('Access Policy API — body shape', () => {
  it('seeded access policies use principals accepted by the backend grammar', () => {
    for (const bucket of getMockBuckets()) {
      for (const policy of getAccessPoliciesForBucket(bucket.id)) {
        expect(policy.principal).toMatch(BUCKET_POLICY_PRINCIPAL_PATTERN)
      }
    }
  })

  it('createBucketAccessPolicy POSTs exactly { principal, permission } without resource', async () => {
    const bucketId = getMockBuckets()[0].id

    let capturedBody: unknown
    server.use(
      http.post('*/api/buckets/:id/access-policies', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          {
            id: 'new-policy-id',
            principal: USER_PRINCIPAL,
            permission: 'roles/storage.objectViewer',
            resource: 'buckets/test',
            createdAt: new Date().toISOString(),
          },
          { status: 201 },
        )
      }),
    )

    await createBucketAccessPolicy(bucketId, {
      principal: USER_PRINCIPAL,
      permission: 'roles/storage.objectViewer',
    })

    expect(capturedBody).toEqual({
      principal: USER_PRINCIPAL,
      permission: 'roles/storage.objectViewer',
    })

    // Must NOT include server-derived fields
    expect(capturedBody).not.toHaveProperty('resource')
    expect(capturedBody).not.toHaveProperty('id')
    expect(capturedBody).not.toHaveProperty('createdAt')
  })

  it('mock rejects resource as an unknown create-request field', async () => {
    const bucketId = getMockBuckets()[0].id

    await expect(apiClient.post(`/api/buckets/${bucketId}/access-policies`, {
      principal: USER_PRINCIPAL,
      permission: 'roles/storage.objectViewer',
      resource: 'buckets/test',
    })).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          error: {
            code: 'invalid_input',
            message: 'invalid request body: json: unknown field "resource"',
          },
        },
      },
    })
  })

  it.each([
    ['public', 'public'],
    ['user UUID', USER_PRINCIPAL],
    ['account UUID', ACCOUNT_PRINCIPAL],
  ])('mock accepts a valid %s principal', async (_label, principal) => {
    const bucketId = getMockBuckets()[0].id

    const policy = await createBucketAccessPolicy(bucketId, {
      principal,
      permission: 'roles/storage.objectViewer',
    })

    expect(policy.principal).toBe(principal)
  })

  it('mock rejects an invalid principal with the backend error message', async () => {
    const bucketId = getMockBuckets()[0].id

    await expect(createBucketAccessPolicy(bucketId, {
      principal: 'user@example.com',
      permission: 'roles/storage.objectViewer',
    })).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          error: {
            code: 'invalid_input',
            message: 'invalid principal: "user@example.com" must be "user:<uuid>", "account:<uuid>" or "public"',
          },
        },
      },
    })
  })

  it('deleteBucketAccessPolicy sends DELETE to the correct path with policyId in the URL', async () => {
    const bucketId = getMockBuckets()[0].id
    const policies = getAccessPoliciesForBucket(bucketId)
    const policyId = policies[0].id

    const axiosDeleteSpy = vi.spyOn(apiClient, 'delete')

    await deleteBucketAccessPolicy(bucketId, policyId)

    expect(axiosDeleteSpy).toHaveBeenCalledWith(
      `/api/buckets/${bucketId}/access-policies/${policyId}`,
    )
  })
})

// ---------------------------------------------------------------------------
// React Query hooks — invalidation
// ---------------------------------------------------------------------------

describe('Access Policy Hooks — query invalidation', () => {
  it('useCreateBucketAccessPolicy invalidates the access-policies query key on success', async () => {
    const bucketId = getMockBuckets()[0].id
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateBucketAccessPolicy(bucketId), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({
      principal: USER_PRINCIPAL,
      permission: 'roles/storage.objectViewer',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: storageKeys.accessPolicies(bucketId),
    })
  })

  it('useDeleteBucketAccessPolicy invalidates the access-policies query key on success', async () => {
    const bucketId = getMockBuckets()[0].id
    const policies = getAccessPoliciesForBucket(bucketId)
    const policyId = policies[0].id

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteBucketAccessPolicy(bucketId), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate(policyId)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: storageKeys.accessPolicies(bucketId),
    })
  })
})

// ---------------------------------------------------------------------------
// BucketSettingsPage — UI integration
// ---------------------------------------------------------------------------

describe('BucketSettingsPage — Access Policies UI', () => {
  it('limitation notice renders whenever the policies section renders', async () => {
    const bucketId = getMockBuckets()[0].id

    render(
      <BucketSettingsPage onBack={() => undefined} selectedRowId={bucketId} />,
      { wrapper: makeWrapper() },
    )

    // The notice must be in the DOM without any user interaction
    const notice = screen.getByTestId('policy-limitation-notice')
    expect(notice).toBeInTheDocument()
    expect(notice).toHaveAttribute('role', 'note')
    expect(notice).toHaveTextContent('recorded but not enforced in v1')
  })

  it('permission select offers exactly the three BucketAccessPermission values', async () => {
    const bucketId = getMockBuckets()[0].id

    // TerminalSelect is a custom dropdown built with divs, not a native <select>.
    // The id is on the outer wrapper div; options are .fci-dd-item children.
    const EXPECTED_PERMISSIONS: BucketAccessPermission[] = [
      'roles/storage.objectViewer',
      'roles/storage.objectAdmin',
      'roles/storage.admin',
    ]

    const { container } = render(
      <BucketSettingsPage onBack={() => undefined} selectedRowId={bucketId} />,
      { wrapper: makeWrapper() },
    )

    const permissionDropdown = container.querySelector('#policy-create-permission')
    expect(permissionDropdown).toBeTruthy()

    // Open the dropdown to render the option items
    fireEvent.click(permissionDropdown!)

    // Each option is a .fci-dd-item div; its data-value holds the raw permission string
    // (TerminalSelect renders option.label in text, but option.value is what onChange receives)
    const optionItems = Array.from(permissionDropdown!.querySelectorAll('.fci-dd-item'))
    expect(optionItems).toHaveLength(EXPECTED_PERMISSIONS.length)

    // Verify each expected permission is represented by a menu item
    // (either as the visible label text or via the click handler)
    const labelTexts = optionItems.map((el) => el.textContent?.trim() ?? '')
    // POLICY_PERMISSION_OPTIONS maps: objectViewer, objectAdmin, admin
    expect(labelTexts).toContain('objectViewer')
    expect(labelTexts).toContain('objectAdmin')
    expect(labelTexts).toContain('admin')
    expect(optionItems).toHaveLength(EXPECTED_PERMISSIONS.length)
  })

  it.each([
    ['an email without a kind', 'user@example.com'],
    ['a non-UUID user ID', 'user:not-a-uuid'],
    ['an unknown principal kind', 'group:123e4567-e89b-12d3-a456-426614174000'],
  ])('blocks %s client-side without issuing a request', (_label, principal) => {
    const bucketId = getMockBuckets()[0].id
    const postSpy = vi.spyOn(apiClient, 'post')

    render(
      <BucketSettingsPage onBack={() => undefined} selectedRowId={bucketId} />,
      { wrapper: makeWrapper() },
    )

    fireEvent.change(screen.getByPlaceholderText('user:<uuid>'), { target: { value: principal } })
    fireEvent.click(screen.getByRole('button', { name: /add policy/i }))

    expect(screen.getByTestId('policy-principal-error')).toHaveTextContent(
      'Principal must be user:<uuid>, account:<uuid> or public',
    )
    expect(postSpy).not.toHaveBeenCalled()
  })

  it('a server 400 with details.field = "principal" surfaces as a field-level error under the principal input', async () => {
    const bucketId = getMockBuckets()[0].id

    server.use(
      http.post('*/api/buckets/:id/access-policies', () => {
        return HttpResponse.json(
          {
            error: {
              code: 'invalid_input',
              message: 'principal is required',
              request_id: 'msw-test-400',
              // Documented field-to-message map shape (API.md:207): { fieldName: message }
              details: { principal: 'principal is required' },
            },
          },
          { status: 400 },
        )
      }),
    )

    render(
      <BucketSettingsPage onBack={() => undefined} selectedRowId={bucketId} />,
      { wrapper: makeWrapper() },
    )

    // Fill principal with something so client validation passes, but server rejects
    const principalInput = screen.getByPlaceholderText('user:<uuid>') as HTMLInputElement
    fireEvent.change(principalInput, { target: { value: USER_PRINCIPAL } })

    // Submit
    const submitBtn = screen.getByRole('button', { name: /add policy/i })
    fireEvent.click(submitBtn)

    // Field-level error must appear under the principal input
    expect(await screen.findByTestId('policy-principal-error')).toBeInTheDocument()
    expect(screen.getByTestId('policy-principal-error')).toHaveTextContent('principal is required')
  })

  it('creates a policy and it appears in the list', async () => {
    const bucketId = getMockBuckets()[0].id
    const initialPolicies = getAccessPoliciesForBucket(bucketId)

    render(
      <BucketSettingsPage onBack={() => undefined} selectedRowId={bucketId} />,
      { wrapper: makeWrapper() },
    )

    // Wait for policies to load (use getAllByText because the same principal string
    // can appear in multiple seeded rows)
    await waitFor(() => {
      const matches = screen.getAllByText(initialPolicies[0].principal)
      expect(matches.length).toBeGreaterThan(0)
    })

    // Fill in the create form
    const principalInput = screen.getByPlaceholderText('user:<uuid>') as HTMLInputElement
    fireEvent.change(principalInput, { target: { value: USER_PRINCIPAL } })

    // Submit
    const submitBtn = screen.getByRole('button', { name: /add policy/i })
    fireEvent.click(submitBtn)

    // New policy should appear in the table
    await waitFor(() => {
      expect(screen.getByText(USER_PRINCIPAL)).toBeInTheDocument()
    })
  })

  it('shows remove confirmation and cancelling keeps the row', async () => {
    const bucketId = getMockBuckets()[0].id

    render(
      <BucketSettingsPage onBack={() => undefined} selectedRowId={bucketId} />,
      { wrapper: makeWrapper() },
    )

    // Wait for policies to load
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /remove policy/i }).length).toBeGreaterThan(0)
    })

    const removeButtons = screen.getAllByRole('button', { name: /remove policy/i })
    fireEvent.click(removeButtons[0])

    // Confirmation appears
    expect(screen.getByText('Remove?')).toBeInTheDocument()

    // Cancel it
    fireEvent.click(screen.getByRole('button', { name: /cancel policy removal/i }))
    expect(screen.queryByText('Remove?')).toBeNull()
  })

  it('surfaces multiple server validation errors simultaneously across request fields', async () => {
    const bucketId = getMockBuckets()[0].id

    server.use(
      http.post('*/api/buckets/:id/access-policies', () => {
        return HttpResponse.json(
          {
            error: {
              code: 'invalid_input',
              message: 'validation failed',
              request_id: 'msw-test-multi',
              details: {
                principal: 'invalid principal format',
                permission: 'invalid permission role',
              },
            },
          },
          { status: 400 },
        )
      }),
    )

    render(
      <BucketSettingsPage onBack={() => undefined} selectedRowId={bucketId} />,
      { wrapper: makeWrapper() },
    )

    const principalInput = screen.getByPlaceholderText('user:<uuid>') as HTMLInputElement
    fireEvent.change(principalInput, { target: { value: USER_PRINCIPAL } })

    const submitBtn = screen.getByRole('button', { name: /add policy/i })
    fireEvent.click(submitBtn)

    expect(await screen.findByTestId('policy-principal-error')).toHaveTextContent('invalid principal format')
    expect(screen.getByTestId('policy-permission-error')).toHaveTextContent('invalid permission role')
  })

  it('surfaces server permission error under the permission select', async () => {
    const bucketId = getMockBuckets()[0].id

    server.use(
      http.post('*/api/buckets/:id/access-policies', () => {
        return HttpResponse.json(
          {
            error: {
              code: 'invalid_input',
              message: 'invalid permission',
              request_id: 'msw-test-perm',
              details: { permission: 'invalid permission role' },
            },
          },
          { status: 400 },
        )
      }),
    )

    render(
      <BucketSettingsPage onBack={() => undefined} selectedRowId={bucketId} />,
      { wrapper: makeWrapper() },
    )

    const principalInput = screen.getByPlaceholderText('user:<uuid>') as HTMLInputElement
    fireEvent.change(principalInput, { target: { value: USER_PRINCIPAL } })

    const submitBtn = screen.getByRole('button', { name: /add policy/i })
    fireEvent.click(submitBtn)

    expect(await screen.findByTestId('policy-permission-error')).toHaveTextContent('invalid permission role')
  })

  it('discards mutation callbacks if active bucket changes while request is in-flight', async () => {
    const buckets = getMockBuckets()
    const bucketId1 = buckets[0].id
    const bucketId2 = buckets[1].id

    let markRequestStarted: () => void = () => {}
    let resolveRequest: () => void = () => {}
    const requestStarted = new Promise<void>((resolve) => {
      markRequestStarted = resolve
    })
    server.use(
      http.post('*/api/buckets/:id/access-policies', async () => {
        markRequestStarted()
        await new Promise<void>((resolve) => {
          resolveRequest = resolve
        })
        return HttpResponse.json(
          {
            id: 'late-policy',
            principal: USER_PRINCIPAL,
            permission: 'roles/storage.objectViewer',
            resource: `buckets/${buckets[0].bucketName}`,
            createdAt: new Date().toISOString(),
          },
          { status: 201 },
        )
      }),
    )

    const { rerender } = render(
      <BucketSettingsPage onBack={() => undefined} selectedRowId={bucketId1} />,
      { wrapper: makeWrapper() },
    )

    // Fill form for bucket 1
    const principalInput = screen.getByPlaceholderText('user:<uuid>') as HTMLInputElement
    fireEvent.change(principalInput, { target: { value: USER_PRINCIPAL } })

    // Submit for bucket 1 (mutation is now pending)
    const submitBtn = screen.getByRole('button', { name: /add policy/i })
    fireEvent.click(submitBtn)

    // Ensure the request is actually in flight before switching buckets.
    await requestStarted

    // Change bucket to bucket 2 before mutation resolves
    rerender(<BucketSettingsPage onBack={() => undefined} selectedRowId={bucketId2} />)

    // Resolve the mutation for bucket 1
    await act(async () => {
      resolveRequest()
      await waitForPendingRequests()
    })

    // Form on bucket 2 should remain reset instead of receiving bucket 1's stale callback.
    expect(screen.getByPlaceholderText('user:<uuid>')).toHaveValue('')
  })
})
