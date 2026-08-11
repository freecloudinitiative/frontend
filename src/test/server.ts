import { setupServer } from 'msw/node'
import { iamHandlers } from '@/mocks/handlers/iam'
import { databaseHandlers } from '@/mocks/handlers/database'
import { vmHandlers } from '@/mocks/handlers/vm'

/**
 * Shared MSW Node server for Vitest integration tests.
 * Spread additional service handlers here as test suites grow.
 */
export const server = setupServer(...iamHandlers, ...databaseHandlers, ...vmHandlers)
