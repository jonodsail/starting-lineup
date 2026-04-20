import { Routes, Route, Navigate } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'

function Root() {
  const hasProfile = !!localStorage.getItem('sl_user_profile')
  return <Navigate to={hasProfile ? '/dashboard' : '/onboarding'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/jobs" element={<Jobs />} />
    </Routes>
  )
}
