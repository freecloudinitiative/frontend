import { lazy, Suspense } from 'react'
import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route } from 'react-router-dom'
import { DashboardOverview } from '@/features/dashboard/DashboardOverview'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { ErrorPage } from '@/pages/ErrorPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastContainer } from '@/features/dashboard/Toast'

const UiPreview = lazy(() => import('@/app/UiPreview').then((m) => ({ default: m.UiPreview })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ComputeEngineDetailPage = lazy(() => import('@/features/computeEngine/pages/ComputeEngineDetailPage').then((m) => ({ default: m.ComputeEngineDetailPage })))
const MyAccountPage = lazy(() => import('@/pages/MyAccountPage').then((m) => ({ default: m.MyAccountPage })))
const StandaloneConsolePage = lazy(() => import('@/pages/StandaloneConsolePage').then((m) => ({ default: m.StandaloneConsolePage })))
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const LandingPage = lazy(() => import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

import { useThemeStore } from '@/store/themeStore'

function RouteFallback() {
  const theme = useThemeStore((s) => s.theme)
  return (
    <div className="fci-page" data-theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: 0 }}>
      <DashboardLoading />
    </div>
  )
}

function RootLayout() {
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
      <ToastContainer />
    </>
  )
}

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />} errorElement={<ErrorPage />}>
      <Route path="/ui-preview" element={<UiPreview />} />
      <Route
        path="/console/:computeEngineId"
        element={
          <ProtectedRoute>
            <StandaloneConsolePage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<LoginPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <MyAccountPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <AboutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/compute-engine/instances/:id"
        element={
          <ProtectedRoute>
            <ComputeEngineDetailPage />
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
      <Route
        path="/services/:serviceId/:resourceId/:tab"
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
