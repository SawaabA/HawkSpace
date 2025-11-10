import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { reload, sendEmailVerification } from "firebase/auth";
import AuthLayout from "@/components/AuthLayout";
import { auth } from "@/services/firebase";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmail() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = useMemo(() => location.state?.email || user?.email || "", [location.state, user]);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // TEMPORARY: Auto-redirect to search since verification is disabled
  React.useEffect(() => {
    if (user) {
      const destination = location.state?.from?.pathname || "/search";
      navigate(destination, { replace: true });
    }
  }, [user, navigate, location.state]);

  const onResend = async () => {
    if (!auth.currentUser) return;
    setStatus("");
    setSending(true);
    try {
      console.log("Resending verification email to:", auth.currentUser.email);
      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      });
      console.log("Verification email sent successfully");
      setStatus("Verification email sent. Check your inbox and spam folder.");
    } catch (err) {
      console.error("Failed to send verification email:", err);
      console.error("Error code:", err?.code);
      console.error("Error message:", err?.message);
      setStatus(`Error: ${err?.code || err?.message || "Failed to send verification email."}`);
    } finally {
      setSending(false);
    }
  };

  const onIHaveVerified = async () => {
    if (!auth.currentUser) return;
    setStatus("");
    setChecking(true);
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        const destination = location.state?.from?.pathname || "/search";
        navigate(destination, { replace: true });
        return;
      }
      setStatus("Still not verified. Please click the link in your email, then try again.");
    } catch (err) {
      setStatus(err?.message || "Failed to check verification status.");
    } finally {
      setChecking(false);
    }
  };

  const onLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We sent a verification link to your email address. You must verify before using HawkSpace."
      footer={null}
    >
      <div className="auth-info" style={{ marginBottom: 16 }}>
        {email ? `Email: ${email}` : "Signed in user"}
      </div>
      {status && <div className="auth-error" style={{ marginBottom: 16 }}>{status}</div>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className="auth-btn" type="button" onClick={onResend} disabled={sending}>
          {sending ? "Sending…" : "Resend verification email"}
        </button>
        <button className="auth-btn" type="button" onClick={onIHaveVerified} disabled={checking}>
          {checking ? "Checking…" : "I have verified"}
        </button>
        <button
          className="auth-btn"
          type="button"
          onClick={onLogout}
          disabled={signingOut}
          style={{ background: "#e5e7eb", color: "#111827" }}
        >
          {signingOut ? "Signing out…" : "Log out"}
        </button>
      </div>
    </AuthLayout>
  );
}


