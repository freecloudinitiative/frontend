import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './styles/globals.css'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'

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

  // App is now unified for all environments without MSW mock data

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  )
}

bootstrap()
