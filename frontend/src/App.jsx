import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage    from './pages/LandingPage'
import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import HomePage       from './pages/HomePage'
import BookingPage    from './pages/BookingPage'
import MyBookingsPage from './pages/MyBookingsPage'
import StaffDashboard from './pages/StaffDashboard'
import ProfilePage    from './pages/ProfilePage'

const PrivateRoute = ({ children, staffOnly }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f0f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #d4eadb', borderTop: '3px solid #2dba6a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: '#6b8f78', fontFamily: "'Sarabun',sans-serif" }}>กำลังโหลด...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (staffOnly && user.user_role !== 'staff') return <Navigate to="/home" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"            element={<LandingPage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/register"    element={<RegisterPage />} />
          <Route path="/home"        element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/booking"     element={<PrivateRoute><BookingPage /></PrivateRoute>} />
          <Route path="/my-bookings" element={<PrivateRoute><MyBookingsPage /></PrivateRoute>} />
          <Route path="/profile"     element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/staff"       element={<PrivateRoute staffOnly><StaffDashboard /></PrivateRoute>} />
          {/* fallback */}
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App