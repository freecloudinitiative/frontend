import { setupWorker } from 'msw/browser'
import { computeEngineHandlers } from '@/mocks/handlers/computeEngine'
import { databaseHandlers } from '@/mocks/handlers/database'
import { iamHandlers } from '@/mocks/handlers/iam'
import { storageHandlers } from '@/mocks/handlers/storage'
import { networkHandlers } from '@/mocks/handlers/network'
import { accountHandlers } from '@/mocks/handlers/account'
import { consoleHandlers } from '@/mocks/handlers/console'

export const worker = setupWorker(
  ...computeEngineHandlers,
  ...databaseHandlers,
  ...iamHandlers,
  ...storageHandlers,
  ...networkHandlers,
  ...accountHandlers,
  ...consoleHandlers,
)
