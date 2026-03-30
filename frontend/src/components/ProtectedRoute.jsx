import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const storedUser = localStorage.getItem("user");

  // 🚫 Not logged in
  if (!storedUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = JSON.parse(storedUser);

  // Normalize role (case-insensitive safety)
  const userRole = user.role?.toUpperCase();
  const normalizedRoles = allowedRoles?.map(role =>
    role.toUpperCase()
  );

  // 🚫 If role not allowed → redirect to their own dashboard
  if (!normalizedRoles.includes(userRole)) {

    switch (userRole) {
      case "SUPERADMIN":
        return <Navigate to="/superadmin/dashboard" replace />;
      case "ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      case "TRAINER":
        return <Navigate to="/trainer/dashboard" replace />;
      case "STUDENT":
        return <Navigate to="/student/dashboard" replace />;
      case "MARKETER":
        return <Navigate to="/marketer/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // ✅ Allowed
  return children;
}

export default ProtectedRoute;
