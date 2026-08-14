import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './styles/globals.css'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { shouldStartMsw } from '@/mocks/env'
import { assertValidProductionConfig, getRuntimeConfig } from '@/lib/runtimeConfig'

function renderConfigurationError(error: unknown) {
  const root = document.getElementById('root')
  if (!root) return
  const container = document.createElement('main')
  const title = document.createElement('h1')
  const detail = document.createElement('p')
  container.setAttribute('role', 'alert')
  container.style.padding = '2rem'
  title.textContent = 'Application configuration error'
  detail.textContent = error instanceof Error ? error.message : 'The production runtime configuration is invalid.'
  container.append(title, detail)
  root.replaceChildren(container)
}

async function bootstrap() {
  try {
    assertValidProductionConfig()
  } catch (error) {
    console.error(error)
    renderConfigurationError(error)
    return
  }

  // Initialize MSW worker in non-prod environments (VITE_APP_ENV !== 'prod')
  if (shouldStartMsw(getRuntimeConfig().appEnv)) {
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
