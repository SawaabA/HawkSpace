import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { ALLOWED_DOMAIN, useAuth } from "@/context/AuthContext";

const TABS = [
  { id: "user", label: "Student / Club" },
  { id: "admin", label: "Admin" },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const intent = useMemo(() => (params.get("intent") === "admin" ? "admin" : "user"), [params]);

  const destination = intent === "admin" ? "/admin/requests" : location.state?.from?.pathname || "/search";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password, { remember });
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={intent === "admin" ? "Admin access requires approved role claims." : "Use your Laurier credentials to request classrooms."}
      footer={
        <div className="auth-footnote">
          Need an account? <Link className="auth-link" to="/signup">Sign up</Link>
          <span style={{ margin: "0 8px", color: "#9ca3af" }}>•</span>
          <Link className="auth-link" to="/forgot-password">Forgot password?</Link>
        </div>
      }
    >
      <div className="auth-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === intent ? "auth-tab active" : "auth-tab"}
            onClick={() => setParams({ intent: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form className="auth-form" onSubmit={onSubmit}>
        <label className="auth-label">
          Laurier Email
          <input
            className="auth-input"
            type="email"
            inputMode="email"
            placeholder={`you${ALLOWED_DOMAIN}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>

        <label className="auth-label">
          Password
          <input
            className="auth-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={intent === "admin" ? "current-password" : "password"}
          />
        </label>

        <div style={{ marginBottom: 8 }}>
          <Link className="auth-link" to="/forgot-password">Forgot password?</Link>
        </div>

        <label className="auth-remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Keep me signed in on this device
        </label>

        <button className="auth-btn" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : intent === "admin" ? "Enter admin console" : "Continue"}
        </button>
      </form>
    </AuthLayout>
  );
}
