import { setupWorker } from 'msw/browser'
import { vmHandlers } from '@/mocks/handlers/vm'

export const worker = setupWorker(...vmHandlers)
