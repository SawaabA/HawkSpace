import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading message="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  // TEMPORARY: Email verification disabled for testing (email delivery not working)
  // TODO: Re-enable once Mailjet email delivery is confirmed working
  // if (user && user.emailVerified === false) {
  //   return <Navigate to="/verify-email" replace state={{ from: location }} />;
  // }

  return children || <Outlet />;
}
