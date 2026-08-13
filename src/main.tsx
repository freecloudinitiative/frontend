import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './styles/globals.css'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { shouldStartMsw } from '@/mocks/env'

async function bootstrap() {
  // Initialize MSW worker in non-prod environments (VITE_APP_ENV !== 'prod')
  if (shouldStartMsw()) {
    try {
      const { worker } = await import('@/mocks/browser')
      await worker.start({
        onUnhandledRequest: 'bypass', // let non-mocked requests pass through normally
      })
    } catch (err) {
      // MSW startup is best-effort — log the failure but always continue to render
      console.error('[MSW] Service worker failed to start:', err)
    }
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
