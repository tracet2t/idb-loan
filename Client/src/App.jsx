import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import MyProfile from './pages/MyProfile'
// import Overview from './pages/Overview' // Ensure you import your other pages
import LoanQueue from "./pages/LoanQueue";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* ✅ The My Profile route is now a child of AppLayout */}
          {/* <Route path="/dashboard" element={<Overview />} /> */}
          <Route path="/applications" element={<LoanQueue />} />
          <Route path="/my-profile" element={<MyProfile />} />
          
          {/* Redirect any unknown protected paths to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App