import { setupServer } from 'msw/node'
import { iamHandlers } from '@/mocks/handlers/iam'
import { databaseHandlers } from '@/mocks/handlers/database'
import { computeEngineHandlers } from '@/mocks/handlers/computeEngine'
import { storageHandlers } from '@/mocks/handlers/storage'
import { networkHandlers } from '@/mocks/handlers/network'
import { accountHandlers } from '@/mocks/handlers/account'
import { consoleHandlers } from '@/mocks/handlers/console'

/**
 * Shared MSW Node server for Vitest integration tests.
 * Spread additional service handlers here as test suites grow.
 */
export const server = setupServer(
  ...iamHandlers,
  ...databaseHandlers,
  ...computeEngineHandlers,
  ...storageHandlers,
  ...networkHandlers,
  ...accountHandlers,
  ...consoleHandlers,
)

const pendingRequests = new Set<string>()

server.events.on('request:start', ({ requestId }) => pendingRequests.add(requestId))
server.events.on('request:end', ({ requestId }) => pendingRequests.delete(requestId))

/** Wait for intercepted requests to finish before jsdom removes browser globals. */
export async function waitForPendingRequests() {
  while (pendingRequests.size > 0) {
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}
