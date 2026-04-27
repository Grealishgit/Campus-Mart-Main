import { Route, Routes, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Layout from './layout/Layout'
import Leases from './pages/Leases'
import Sales from './pages/Sales'
import Listings from './pages/Listings'
import Orders from './pages/Orders'
import Users from './pages/Users'
import Profile from './pages/Profile'
import Logs from './pages/Logs'
import Settings from './pages/Settings'
import LoginPage from './auth/LoginPage'
import { useAuth } from './hooks/useAuth'
import Notifications from './pages/Notifications'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/lease" element={<Leases />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/users" element={<Users />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>
    </Routes>
  )
}

export default App