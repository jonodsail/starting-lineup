import { lazy, Suspense, useLayoutEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import AppShell from './components/AppShell'

const Login = lazy(() => import('./pages/Login'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Opportunities = lazy(() => import('./pages/Opportunities'))
const Alumni = lazy(() => import('./pages/Alumni'))
const Tracker = lazy(() => import('./pages/Tracker'))
const Admin = lazy(() => import('./pages/Admin'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
  }, [pathname])
  return null
}

function ProtectedRoute() {
  const { loading, member } = useAuth()
  const location = useLocation()
  if (loading) return <div className="min-h-screen grid place-items-center text-ink-muted">Loading your club workspace…</div>
  if (!member) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

function MemberRoute() {
  const { profile } = useAuth()
  const location = useLocation()
  if (!profile?.onboardingComplete && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return <AppShell />
}

function OfficerRoute() {
  const { isOfficer } = useAuth()
  return isOfficer ? <Admin /> : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen grid place-items-center text-ink-muted">Loading Starting Lineup…</div>}><Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MemberRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/alumni" element={<Alumni />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/admin" element={<OfficerRoute />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes></Suspense>
    </AuthProvider>
  )
}
