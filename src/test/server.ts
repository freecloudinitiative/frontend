import { setupServer } from 'msw/node'
import { iamHandlers } from '@/mocks/handlers/iam'

/**
 * Shared MSW Node server for Vitest integration tests.
 * Includes IAM handlers. Other service handlers can be spread in here
 * as additional feature test suites are added.
 */
export const server = setupServer(...iamHandlers)
