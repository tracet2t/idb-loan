import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import MyProfile from './pages/MyProfile';
import LoanQueue from "./pages/LoanQueue";
// import Dashboard from "./pages/Dashboard"; 
import UserManagement from "./pages/UserManagement"; 
// import DataMigration from "./pages/DataMigration"; 
import ReferenceData from './pages/ReferenceData';
import CreateLoan from './pages/CreateLoan';

// App.jsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes Wrapper */}
        <Route
          path="/*"
          element={
            <ProtectedRoute allowedRoles={['super-admin', 'data-entry']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="applications" element={<LoanQueue />} />
          <Route path="my-profile" element={<MyProfile />} />
          <Route path="reference-data" element={<ReferenceData />} />
          
          <Route 
            path="new-loan" 
            element={
              <ProtectedRoute allowedRoles={['data-entry']}>
                <CreateLoan />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="user-management" 
            element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/applications" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;