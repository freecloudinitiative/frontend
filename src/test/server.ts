import { setupServer } from 'msw/node'
import { iamHandlers } from '@/mocks/handlers/iam'
import { databaseHandlers } from '@/mocks/handlers/database'
import { computeEngineHandlers } from '@/mocks/handlers/computeEngine'
import { storageHandlers } from '@/mocks/handlers/storage'
import { networkHandlers } from '@/mocks/handlers/network'

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
)
