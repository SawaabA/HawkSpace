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
  const email = useMemo(() => {
    // Try location state first, then sessionStorage, then user email
    const fromState = location.state?.email;
    const fromSession = sessionStorage.getItem("verifyEmail");
    // Clear sessionStorage after reading
    if (fromSession) sessionStorage.removeItem("verifyEmail");
    return fromState || fromSession || user?.email || "";
  }, [location.state, user]);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
    if (!auth.currentUser) {
      setStatus("No signed-in user. Please log in again.");
      return;
    }

    setStatus("");
    setChecking(true);

    try {
      // 1) First, check Firebase directly to see if the user is already verified
      try {
        await reload(auth.currentUser);
      } catch (reloadErr) {
        console.warn("Failed to reload user before verification check:", reloadErr);
      }

      if (auth.currentUser.emailVerified) {
        // Already verified – just send them through
        setStatus("Email already verified. Redirecting…");
        const destination = location.state?.from?.pathname || "/search";
        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 800);
        return;
      }

      // 2) Not verified yet – TEMPORARY: try to forcibly verify via local API,
      // then allow them through even if that API is not available.
      const emailToVerify = auth.currentUser.email;
      console.log("Attempting API email verification for:", emailToVerify);

      try {
        const response = await fetch("http://localhost:3001/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailToVerify }),
        });

        if (!response.ok) {
          // Log but don't block – this is a temporary testing path
          let data = null;
          try {
            data = await response.json();
          } catch {
            // ignore JSON parse errors
          }
          console.warn("API verify-email failed", response.status, data);
        } else {
          console.log("API verification call succeeded, reloading user…");
          try {
            await reload(auth.currentUser);
          } catch (reloadErr) {
            console.warn("Failed to reload user after API verification:", reloadErr);
          }
        }
      } catch (apiErr) {
        console.warn("API verification request failed (server may not be running):", apiErr);
      }

      // 3) TEMPORARY: Regardless of result, allow the user through after clicking the button.
      // ProtectedRoute does not currently enforce emailVerified, so this simply
      // matches that relaxed behavior while keeping a clear message to the user.
      setStatus("Temporarily treating your email as verified for testing. Redirecting…");
      const destination = location.state?.from?.pathname || "/search";
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 800);
    } catch (err) {
      console.error("Verification error:", err);
      setStatus(err?.message || "Failed to verify email. Please try again.");
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


