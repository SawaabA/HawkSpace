import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, ALLOWED_DOMAIN } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/rooms";

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      login(email.trim());
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, Arial", maxWidth: 420 }}>
      <h1>Login</h1>
      <p style={{ color: "#6b7280", marginTop: -6 }}>Write your {ALLOWED_DOMAIN} email.</p>

      {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: ".6rem .8rem", borderRadius: 8, marginBottom: 12 }}>{error}</div>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.8rem" }}>
        <label>
          Email
          <input
            type="email"
            placeholder={`you${ALLOWED_DOMAIN}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: ".6rem", borderRadius: 8, border: "1px solid #e5e7eb" }}
            required
          />
        </label>
        <button type="submit" style={{ background: "#111827", color: "#fff", padding: ".7rem 1rem", border: "none", borderRadius: 8 }}>
          Continue
        </button>
      </form>
    </div>
  );
}
