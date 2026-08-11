import { setupWorker } from 'msw/browser'
import { vmHandlers } from '@/mocks/handlers/vm'
import { databaseHandlers } from '@/mocks/handlers/database'

export const worker = setupWorker(...vmHandlers, ...databaseHandlers)
