import { setupWorker } from 'msw/browser'
import { computeEngineHandlers } from '@/mocks/handlers/computeEngine'
import { databaseHandlers } from '@/mocks/handlers/database'
import { iamHandlers } from '@/mocks/handlers/iam'
import { storageHandlers } from '@/mocks/handlers/storage'
import { networkHandlers } from '@/mocks/handlers/network'

export const worker = setupWorker(
  ...computeEngineHandlers,
  ...databaseHandlers,
  ...iamHandlers,
  ...storageHandlers,
  ...networkHandlers,
)
