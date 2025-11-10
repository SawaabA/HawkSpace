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
      console.log("Attempting to send password reset email to:", eLower);
      await sendPasswordResetEmail(auth, eLower, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      console.log("Password reset email sent successfully");
      setStatus("If an account exists for this email, a reset link has been sent.");
    } catch (err) {
      console.error("Failed to send password reset email:", err);
      console.error("Error code:", err?.code);
      console.error("Error message:", err?.message);
      // For security, avoid leaking whether an email exists
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

        <button className="auth-btn" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}


