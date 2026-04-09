import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './layout/Sidebar'
import LoanQueue from '../pages/LoanQueue'
import UserManagement from '../pages/UserManagement'
import MyProfile from '../pages/MyProfile'
// Add more page imports here as you build them
// import Dashboard from '../pages/Dashboard'

// Placeholder pages for routes not yet built
const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <p className="text-xl font-semibold text-slate-600">{title}</p>
      <p className="text-sm text-slate-400 mt-1">Coming soon</p>
    </div>
  </div>
)

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="ml-64 flex-1 p-6 overflow-y-auto">
        <Routes>
          <Route path="/dashboard"       element={<Placeholder title="Dashboard" />} />
          <Route path="/applications"    element={<LoanQueue />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/reference-data"  element={<Placeholder title="Reference Data" />} />
          <Route path="/my-profile"      element={<MyProfile />} />
          <Route path="*"                element={<Navigate to="/applications" replace />} />
        </Routes>
      </main>
    </div>
  )
}