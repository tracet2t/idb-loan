import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import MyProfile from "./pages/MyProfile";
import LoanQueue from "./pages/LoanQueue";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import ReferenceData from "./pages/ReferenceData";
import CreateLoan from "./pages/CreateLoan";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute allowedRoles={["super-admin", "data-entry"]}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard — super-admin only */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={["super-admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Shared routes */}
          <Route path="applications" element={<LoanQueue />} />
          <Route path="my-profile" element={<MyProfile />} />
          <Route path="reference-data" element={<ReferenceData />} />

          {/* Data entry only */}
          <Route
            path="new-loan"
            element={
              <ProtectedRoute allowedRoles={["data-entry"]}>
                <CreateLoan />
              </ProtectedRoute>
            }
          />

          {/* Super admin only */}
          <Route
            path="user-management"
            element={
              <ProtectedRoute allowedRoles={["super-admin"]}>
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
