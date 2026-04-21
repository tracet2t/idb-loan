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

  // // 🛠️ Debugging வரிகள் (இதைச் சேர்த்துப் பாருங்கள்)
  // console.log("--- Security Check ---");
  // console.log("Current Token:", token ? "Exists" : "Empty");
  // console.log("Current User Role:", userRole);
  // console.log("Required Roles for this page:", allowedRoles);
  
  // செக் செய்கிறோம்: யூசரின் ரோல் அனுமதிக்கப்பட்ட லிஸ்டில் இருக்கிறதா?
  const isAuthorized = allowedRoles ? allowedRoles.includes(userRole) : true;
  // console.log("Is User Authorized?:", isAuthorized);

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