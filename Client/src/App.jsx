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

        {/* Protected routes – all wrapped in AppLayout (sidebar + main) */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* ✅ Fixed: Removed leading slashes from child routes */}
          <Route path="applications" element={<LoanQueue />} />
          <Route path="my-profile" element={<MyProfile />} />
          
          {/* Redirect any unknown protected paths to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  )
}

export default App