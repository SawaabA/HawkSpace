import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading, claimsLoaded } = useAuth();
  const location = useLocation();

  if (loading || (user && !claimsLoaded)) return <Loading message="Verifying admin access…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children || <Outlet />;
}
