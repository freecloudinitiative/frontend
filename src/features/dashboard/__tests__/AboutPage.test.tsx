import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AboutPage } from '@/pages/AboutPage'
import { SERVICE_CONTENT } from '@/constants/serviceContent'

function renderAboutPage() {
  return render(
    <MemoryRouter initialEntries={['/about']}>
      <Routes>
        <Route path="/about" element={<AboutPage />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AboutPage Technical Manifesto', () => {
  it('renders retro ASCII manifesto title and sections', () => {
    renderAboutPage()

    expect(screen.getByText(/FREE CLOUD INITIATIVE \/\/ TECHNICAL MANIFESTO/i)).toBeInTheDocument()
    expect(screen.getByText(/\[ MISSION_STATEMENT \]/i)).toBeInTheDocument()
    expect(screen.getByText(/\[ ARCHITECTURAL_DECISIONS \]/i)).toBeInTheDocument()
    expect(screen.getByText(/\[ PERFORMANCE_COMMITMENTS \]/i)).toBeInTheDocument()
    expect(screen.getByText(/\[ TECH_STACK_MATRIX \]/i)).toBeInTheDocument()
  })

  it('navigates back to dashboard when clicking back button', () => {
    renderAboutPage()

    const backBtn = screen.getByRole('button', { name: /Back to Dashboard/i })
    fireEvent.click(backBtn)

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })
})

describe('SERVICE_CONTENT Dictionary', () => {
  it('contains valid ServiceInfo entries for primary cloud services', () => {
    const services = ['Compute Engine', 'Database', 'IAM', 'Storage', 'Network', 'Load Balancer', 'Kubernetes', 'Security']

    for (const service of services) {
      expect(SERVICE_CONTENT[service]).toBeDefined()
      expect(SERVICE_CONTENT[service].title).toBeTruthy()
      expect(SERVICE_CONTENT[service].aboutText.length).toBeGreaterThan(0)
      expect(SERVICE_CONTENT[service].creationGuide.overview).toBeTruthy()
    }
  })
})
