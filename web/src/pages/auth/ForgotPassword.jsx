import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import AuthLayout from "@/components/AuthLayout";
import { auth } from "@/services/firebase";
import { ALLOWED_DOMAIN } from "@/context/AuthContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    const eLower = String(email || "").trim().toLowerCase();
    if (!eLower.endsWith(ALLOWED_DOMAIN)) {
      setError(`Please enter your ${ALLOWED_DOMAIN} email.`);
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, eLower, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      setStatus("If an account exists for this email, a reset link has been sent.");
    } catch (err) {
      setStatus("If an account exists for this email, a reset link has been sent.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={`Enter your ${ALLOWED_DOMAIN} address and we'll email a reset link.`}
      footer={<Link className="auth-link" to="/login">Back to sign in</Link>}
    >
      {error && <div className="auth-error">{error}</div>}
      {status && <div className="auth-success">{status}</div>}

      <form className="auth-form" onSubmit={onSubmit}>
        {/* Floating label: Email */}
        <div className="auth-box">
          <input
            type="email"
            className="auth-input"
            placeholder=" "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <label className="auth-label">Laurier Email</label>
        </div>

        <button className="auth-btn" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}
