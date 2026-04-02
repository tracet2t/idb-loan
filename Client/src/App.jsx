import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

// Import all Error Pages
import NotFound from './pages/Errors/NotFound';
import Unauthorized from './pages/Errors/Unauthorized';
import Forbidden from './pages/Errors/Forbidden';
import ServerError from './pages/Errors/ServerError';
import RateLimited from './pages/Errors/RateLimited';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Main Application Routes --- */}
        
        {/* Redirect empty path to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        
        {/* Placeholder for your Dashboard (Add this when you create the component) */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}

        {/* --- Explicit Error Routes --- */}
        {/* These allow you to manually navigate to these pages for testing */}
        <Route path="/401" element={<Unauthorized />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/429" element={<RateLimited />} />
        <Route path="/500" element={<ServerError />} />

        {/* --- Catch-All Route --- */}
        {/* This MUST be the last route. It catches any URL that doesn't match the ones above */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;