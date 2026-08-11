import { setupWorker } from 'msw/browser'
import { vmHandlers } from '@/mocks/handlers/vm'
import { databaseHandlers } from '@/mocks/handlers/database'
import { iamHandlers } from '@/mocks/handlers/iam'

export const worker = setupWorker(...vmHandlers, ...databaseHandlers, ...iamHandlers)
