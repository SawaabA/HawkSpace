import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import UnauthRoute from "@/components/UnauthRoute";
import AdminRoute from "@/components/AdminRoute";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import Logout from "@/pages/auth/Logout";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import StudentLayout from "@/pages/student/StudentLayout";
import SearchAvailability from "@/pages/student/SearchAvailability";
import RequestBooking from "@/pages/student/RequestBooking";
import MyRequests from "@/pages/student/MyRequests";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminRequests from "@/pages/admin/AdminRequests";

function NotFound() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>404</h1>
      <p>Page not found.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<UnauthRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/logout" element={<Logout />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<StudentLayout />}>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<SearchAvailability />} />
          <Route path="/request" element={<RequestBooking />} />
          <Route path="/my-requests" element={<MyRequests />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminRequests />} />
          <Route path="/admin/requests" element={<AdminRequests />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
