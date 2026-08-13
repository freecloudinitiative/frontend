import { http, HttpResponse, delay } from 'msw'
import { createGetByIdHandler, createDeleteHandler, createSettingsPatchHandler, createListHandler, defaultJitter as jitter } from './utils'
import {
  getIamUsers,
  getIamUserById,
  createIamUser,
  updateIamUser,
  deleteIamUser,
  getIamUserActivity,
} from '@/mocks/data/iamUsers'
import type { CreateIamUserInput, UpdateIamUserInput } from '@/features/iam/types'

const VALID_STATUSES = new Set(['active', 'disabled', 'locked'])
const VALID_ROLES = new Set(['admin', 'editor', 'viewer', 'auditor'])

export const iamHandlers = [
  // GET /api/iam/users — returns user list
  createListHandler('*/api/iam/users', getIamUsers),

  // GET /api/iam/users/:id — single user with embedded policies
  createGetByIdHandler('*/api/iam/users/:id', getIamUserById, 'User', jitter),

  // POST /api/iam/users — create user
  http.post('*/api/iam/users', async ({ request }) => {
    await delay(jitter())

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return HttpResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
    }

    const b = body as Record<string, unknown>

    if (typeof b.name !== 'string' || b.name.trim().length === 0) {
      return HttpResponse.json({ error: 'name is required and must be a non-empty string' }, { status: 400 })
    }
    if (typeof b.email !== 'string' || !b.email.includes('@')) {
      return HttpResponse.json({ error: 'email is required and must be a valid address' }, { status: 400 })
    }
    if (typeof b.role !== 'string' || !VALID_ROLES.has(b.role)) {
      return HttpResponse.json({ error: `role must be one of: ${[...VALID_ROLES].join(', ')}` }, { status: 400 })
    }

    const input: CreateIamUserInput = {
      name: b.name.trim(),
      email: b.email.trim().toLowerCase(),
      role: b.role as CreateIamUserInput['role'],
    }

    const user = createIamUser(input)
    return HttpResponse.json(user, { status: 201 })
  }),

  // DELETE /api/iam/users/:id — delete user
  createDeleteHandler('*/api/iam/users/:id', deleteIamUser, 'User', jitter),

  // PATCH /api/iam/users/:id — update user (status, role changes)
  http.patch('*/api/iam/users/:id', async ({ params, request }) => {
    await delay(jitter())

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      rawBody = {}
    }

    if (typeof rawBody !== 'object' || rawBody === null || Array.isArray(rawBody)) {
      return HttpResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const allowedKeys = new Set(['status', 'role', 'mfaEnabled'])
    const bodyObj = rawBody as Record<string, unknown>
    for (const key of Object.keys(bodyObj)) {
      if (!allowedKeys.has(key)) {
        return HttpResponse.json({ error: `Unknown field: ${key}` }, { status: 400 })
      }
    }

    if ('status' in bodyObj) {
      if (typeof bodyObj.status !== 'string' || !VALID_STATUSES.has(bodyObj.status)) {
        return HttpResponse.json(
          { error: `status must be one of: ${[...VALID_STATUSES].join(', ')}` },
          { status: 400 },
        )
      }
    }
    if ('role' in bodyObj) {
      if (typeof bodyObj.role !== 'string' || !VALID_ROLES.has(bodyObj.role)) {
        return HttpResponse.json(
          { error: `role must be one of: ${[...VALID_ROLES].join(', ')}` },
          { status: 400 },
        )
      }
    }
    if ('mfaEnabled' in bodyObj && typeof bodyObj.mfaEnabled !== 'boolean') {
      return HttpResponse.json({ error: 'mfaEnabled must be a boolean' }, { status: 400 })
    }

    const validatedInput: UpdateIamUserInput = {}
    if ('status' in bodyObj) validatedInput.status = bodyObj.status as UpdateIamUserInput['status']
    if ('role' in bodyObj) validatedInput.role = bodyObj.role as UpdateIamUserInput['role']
    if ('mfaEnabled' in bodyObj) validatedInput.mfaEnabled = bodyObj.mfaEnabled as boolean

    const updated = updateIamUser(params.id as string, validatedInput)
    if (!updated) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return HttpResponse.json(updated)
  }),

  // GET /api/iam/users/:id/activity — activity log for a user
  http.get('*/api/iam/users/:id/activity', async ({ params }) => {
    await delay(jitter())

    const activity = getIamUserActivity(params.id as string)
    if (!activity) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return HttpResponse.json(activity)
  }),

  // PATCH /api/iam/users/:id/settings
  createSettingsPatchHandler('*/api/iam/users/:id/settings', getIamUserById, 'User', jitter),
]
