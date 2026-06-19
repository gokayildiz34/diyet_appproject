/**
 * FitPlate - Protected Route Component
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
