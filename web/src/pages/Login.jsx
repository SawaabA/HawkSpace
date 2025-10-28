import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { getAnalyticsInstance } from "../analytics";
import AuthLayout from "../components/AuthLayout";
import "../styles/Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const eLower = email.trim().toLowerCase();
      if (!eLower.endsWith("@mylaurier.ca")) {
        throw new Error("Please use your @mylaurier.ca email to sign in.");
      }

      await signInWithEmailAndPassword(auth, eLower, password);

      const analytics = await getAnalyticsInstance();
      if (analytics) logEvent(analytics, "login", { method: "password" });

      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      footer={<Link className="auth-link" to="/signup">Create account</Link>}
    >
      {error && <div className="auth-error">{error}</div>}

      <form className="auth-form" onSubmit={onSubmit}>
        <div className="auth-field">
          <label className="auth-label">Laurier Email</label>
          <input
            className="auth-input"
            type="email"
            inputMode="email"
            placeholder="you@mylaurier.ca"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input
            className="auth-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button className="auth-btn" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>
    </AuthLayout>
  );
}
