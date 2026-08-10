import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router-dom'
import { UiPreview } from '@/app/UiPreview'
import { DashboardPage } from '@/pages/DashboardPage'
import { VmDetailPage } from '@/features/vm/pages/VmDetailPage'

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/ui-preview" element={<UiPreview />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Navigate to="/services/vm/details" replace />} />
      <Route path="/services/vm/instances/:id" element={<VmDetailPage />} />
      <Route path="/services/:serviceId" element={<Navigate to="details" replace />} />
      <Route path="/services/:serviceId/:tab" element={<DashboardPage />} />
    </>,
  ),
)
