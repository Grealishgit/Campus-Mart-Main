import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Layout from './layout/layout'
import Leases from './pages/Leases'
import Sales from './pages/Sales'
import Listings from './pages/Listings'
import Orders from './pages/Orders'
import Users from './pages/Users'
import Profile from './pages/profile'
import Logs from './pages/logs'
// import LoginPage from './pages/LoginPage'




const  App=()=> {
  return (
    <Routes>
      {/* <Route path='/login' element={<LoginPage />} /> */}
      {/* <Route path='/' element={<Navigate to="/dashboard" replace />} /> */}

        <Route element={<Layout />}>
          <Route path="/"   element={<Dashboard />} />
          <Route path="/leases"   element={<Leases />} />
          <Route path="/sales"   element={<Sales />} />
          <Route path="/listings"   element={<Listings />} />
          <Route path="/orders"   element={<Orders />} />
          <Route path="/users"   element={<Users />} />
          <Route path="/users"   element={<Logs />} />
          <Route path="/users"   element={<Profile />} />

        </Route>
      </Routes>

  )
}

export default App