import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route } from 'react-router-dom'
import { UiPreview } from '@/app/UiPreview'
import { DashboardPage } from '@/pages/DashboardPage'
import { DashboardOverview } from '@/features/dashboard/DashboardOverview'
import { VmDetailPage } from '@/features/vm/pages/VmDetailPage'
import { StandaloneConsolePage } from '@/pages/StandaloneConsolePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ErrorPage } from '@/pages/ErrorPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Outlet />} errorElement={<ErrorPage />}>
      <Route path="/ui-preview" element={<UiPreview />} />
      <Route path="/console/:vmName" element={<StandaloneConsolePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/vm/instances/:id"
        element={
          <ProtectedRoute>
            <VmDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/:serviceId"
        element={
          <ProtectedRoute>
            <Navigate to="info" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/:serviceId/:tab"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
)
