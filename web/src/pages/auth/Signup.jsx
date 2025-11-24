import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import AuthLayout from "@/components/AuthLayout";
import { auth, db } from "@/services/firebase";
import { getAnalyticsInstance } from "@/services/analytics";
import { ALLOWED_DOMAIN, isAllowedEmail, useAuth } from "@/context/AuthContext";

export default function Signup() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSigningUp = useRef(false);

  // Redirect already-authenticated users (but not during signup process)
  useEffect(() => {
    if (user && !isSigningUp.current) {
      navigate("/search", { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    isSigningUp.current = true; // Flag to prevent redirect during signup
    try {
      const eLower = email.trim().toLowerCase();
      if (!isAllowedEmail(eLower)) {
        throw new Error(
          `Please use your ${ALLOWED_DOMAIN} email or a Gmail address (temporary testing rule).`
        );
      }

      const cred = await createUserWithEmailAndPassword(auth, eLower, password);
      if (displayName) await updateProfile(cred.user, { displayName });
      
      // Try to create user profile in Firestore, but don't fail if permissions are missing
      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: displayName || cred.user.displayName || "",
          createdAt: serverTimestamp(),
        });
      } catch (firestoreErr) {
        console.warn("Failed to create user profile in Firestore (will be created on next login):", firestoreErr);
      }

      const analytics = await getAnalyticsInstance();
      if (analytics) {
        const { logEvent } = await import("firebase/analytics");
        logEvent(analytics, "sign_up", { method: "password" });
      }

      // Send verification email - should work for both @mylaurier.ca and Gmail addresses
      try {
        console.log("Sending verification email to:", cred.user.email);
        await sendEmailVerification(cred.user, {
          url: `${window.location.origin}/login`,
          handleCodeInApp: false,
        });
        console.log("Verification email sent successfully to:", cred.user.email);
      } catch (verifyErr) {
        // Log detailed error for debugging Mailjet/Gmail issues
        console.error("Failed to send verification email after signup", verifyErr);
        console.error("Email address:", cred.user.email);
        console.error("Error code:", verifyErr?.code);
        console.error("Error message:", verifyErr?.message);
      }

      // Use window.location to force immediate navigation before UnauthRoute can redirect
      // navigate() is async and loses race condition with UnauthRoute
      console.log("Navigating to /verify-email for:", cred.user.email);
      // Store email in sessionStorage so VerifyEmail page can access it
      sessionStorage.setItem("verifyEmail", cred.user.email);
      window.location.href = "/verify-email";
    } catch (err) {
      if (err?.code === "auth/email-already-in-use") {
        try {
          isSigningUp.current = true; // Flag to prevent redirect
          const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
          // Use window.location to force immediate navigation
          sessionStorage.setItem("verifyEmail", cred.user.email);
          window.location.href = "/verify-email";
          return;
        } catch (signinErr) {
          const message =
            signinErr?.code === "auth/wrong-password"
              ? "Account already exists. Please sign in or reset your password."
              : "Account already exists. Please sign in.";
          setError(message);
          return;
        }
      }
      setError(err?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your HawkSpace account"
      footer={<Link className="auth-link" to="/login">Already have an account?</Link>}
    >
      {error && <div className="auth-error">{error}</div>}

      <form className="auth-form" onSubmit={onSubmit}>
        {/* Full name */}
        <div className="auth-box">
          <input
            type="text"
            className="auth-input"
            placeholder=" "
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <label className="auth-label">Full Name</label>
        </div>

        {/* Email */}
        <div className="auth-box">
          <input
            type="email"
            className="auth-input"
            placeholder=" "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
          <label className="auth-label">Laurier Email</label>
        </div>

        {/* Password */}
        <div className="auth-box">
          <input
            type="password"
            className="auth-input"
            placeholder=" "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <label className="auth-label">Password</label>
        </div>

        <button className="auth-btn" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Sign Up"}
        </button>
      </form>
    </AuthLayout>
  );
}
