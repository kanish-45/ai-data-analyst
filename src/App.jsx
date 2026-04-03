import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage   from './pages/LoginPage'
import SignupPage  from './pages/SignupPage'
import Dashboard   from './pages/Dashboard'

// If already logged in, go to landing page (not dashboard)
function GuestRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/" replace />
  return children
}

// If not logged in, go to login
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={
          <GuestRoute><LoginPage /></GuestRoute>
        } />
        <Route path="/signup" element={
          <GuestRoute><SignupPage /></GuestRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App