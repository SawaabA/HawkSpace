import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

export default function UnauthRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading message="Loading session…" />;
  if (user) return <Navigate to={location.state?.from?.pathname || "/search"} replace />;
  return children || <Outlet />;
}
