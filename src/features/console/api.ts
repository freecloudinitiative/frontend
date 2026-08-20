import apiClient from '@/lib/axios'

export interface ConsoleTicketResponse {
  ticket: string
  expiresIn: number
}

/**
 * Mint a single-use console ticket for the given Compute Engine instance.
 *
 * POST /api/console/tickets
 * body  { "instance_id": "<instanceId>" }
 * resp  { "ticket": "<opaque>", "expires_in": <seconds> }
 *
 * account_id is deliberately NOT sent — the API gateway derives it from the
 * authenticated actor (Bearer token) on the server side.
 *
 * Tickets are single-use (redeemed via GetDel by terminal-gateway). Never
 * cache or reuse the returned value across connection attempts.
 */
export async function mintConsoleTicket(instanceId: string): Promise<ConsoleTicketResponse> {
  const response = await apiClient.post<{ ticket: string; expires_in: number }>('/api/console/tickets', {
    instance_id: instanceId,
  })
  return {
    ticket: response.data.ticket,
    expiresIn: response.data.expires_in,
  }
}
