import { http, HttpResponse, delay } from 'msw'
import { defaultJitter as jitter } from './utils'

/**
 * Mock handler for the console ticket endpoint.
 *
 * POST /api/console/tickets
 * body  { "instance_id": "<id>" }
 * resp  { "ticket": "mock-ticket", "expires_in": 60 }
 *
 * terminal-gateway reads ?ticket= from the WebSocket upgrade URL.
 * The ticket is single-use in production; the mock always returns the same
 * value which is fine for dev/test since MSW intercepts the WS URL anyway.
 */
export const consoleHandlers = [
  http.post('*/api/console/tickets', async () => {
    await delay(jitter())
    return HttpResponse.json({ ticket: 'mock-ticket', expires_in: 60 }, { status: 200 })
  }),
]
