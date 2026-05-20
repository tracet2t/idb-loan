// import { Navigate } from 'react-router-dom';

// function ProtectedRoute({ allowedRoles, children }) {
//   const userRole = localStorage.getItem('role');
//   const token = localStorage.getItem('token'); 

//   if (!token || !userRole) {
//     return <Navigate to="/login" replace />;
//   }

//   if (allowedRoles && !allowedRoles.includes(userRole)) {
//     return <Navigate to="/applications" replace />;
//   }

//   return children;
// }

// export default ProtectedRoute;


import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles, children }) {
  const userRole = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const status = localStorage.getItem('status');

  // console.log("--- Security Check ---");
  // console.log("Current Token:", token ? "Exists" : "Empty");
  // console.log("Current User Role:", userRole);
  // console.log("Required Roles for this page:", allowedRoles);
  
  const isAuthorized = allowedRoles ? allowedRoles.includes(userRole) : true;
  // console.log("Is User Authorized?:", isAuthorized);

  if (status !== 'Active') {
    console.warn("Access Denied: Account is not Active.");
    return <Navigate to="/login" replace />;
  }

  if (!token || !userRole) {
    console.warn("Access Denied: No Token or Role found.");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !isAuthorized) {
    console.error(`Access Denied: ${userRole} is not allowed to view this page.`);
    return <Navigate to="/applications" replace />;
  }

  return children ? children : <Outlet />
}