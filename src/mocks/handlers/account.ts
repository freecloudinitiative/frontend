import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import { addApiKey, getAccount, removeApiKey, updateAccount, type UpdateAccountSettingsInput } from '@/mocks/data/account'

const DELAY_MIN = 300
const DELAY_MAX = 600

function jitter() {
  return faker.number.int({ min: DELAY_MIN, max: DELAY_MAX })
}

export const accountHandlers = [
  // GET /api/account
  http.get('*/api/account', async () => {
    await delay(jitter())
    return HttpResponse.json(getAccount())
  }),

  // PATCH /api/account/settings
  http.patch('*/api/account/settings', async ({ request }) => {
    await delay(jitter())

    let body: UpdateAccountSettingsInput = {}
    try {
      body = (await request.json()) as UpdateAccountSettingsInput
    } catch {
      // allow empty body
    }

    const updated = updateAccount(body)
    return HttpResponse.json(updated)
  }),

  // POST /api/account/api-keys
  http.post('*/api/account/api-keys', async ({ request }) => {
    await delay(jitter())

    let body: { name?: string } = {}
    try {
      body = (await request.json()) as { name?: string }
    } catch {
      // allow empty body
    }

    const name = body.name?.trim()
    if (!name) {
      return HttpResponse.json({ error: 'Key name is required' }, { status: 400 })
    }

    const result = addApiKey(name)
    return HttpResponse.json(result, { status: 201 })
  }),

  // DELETE /api/account/api-keys/:keyId
  http.delete('*/api/account/api-keys/:keyId', async ({ params }) => {
    await delay(jitter())

    const { removed, apiKeys } = removeApiKey(params.keyId as string)
    if (!removed) {
      return HttpResponse.json({ error: 'API key not found' }, { status: 404 })
    }
    return HttpResponse.json({ apiKeys })
  }),
]
