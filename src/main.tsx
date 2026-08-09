import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './styles/globals.css'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'

async function bootstrap() {
  // Start MSW in development mode only — never ships to production
  if (import.meta.env.DEV) {
    const { worker } = await import('@/mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass', // let non-mocked requests pass through normally
    })
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  )
}

bootstrap()
