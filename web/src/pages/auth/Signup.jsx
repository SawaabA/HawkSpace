import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import AuthLayout from "@/components/AuthLayout";
import { auth, db } from "@/services/firebase";
import { getAnalyticsInstance } from "@/services/analytics";
import { ALLOWED_DOMAIN } from "@/context/AuthContext";

export default function Signup() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const eLower = email.trim().toLowerCase();
      if (!eLower.endsWith(ALLOWED_DOMAIN)) {
        throw new Error(`Please use your ${ALLOWED_DOMAIN} email to sign up.`);
      }

      const cred = await createUserWithEmailAndPassword(auth, eLower, password);

      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName || cred.user.displayName || "",
        createdAt: serverTimestamp(),
      });

      // TEMPORARY: Skip verification email for now
      // TODO: Re-enable once email delivery is fixed
      // try {
      //   console.log("Attempting to send verification email to:", cred.user.email);
      //   await sendEmailVerification(cred.user, {
      //     url: window.location.origin + '/login',
      //     handleCodeInApp: false
      //   });
      //   console.log("Verification email sent successfully");
      // } catch (verifyErr) {
      //   console.error("Failed to send verification email:", verifyErr);
      //   console.error("Error code:", verifyErr?.code);
      //   console.error("Error message:", verifyErr?.message);
      // }

      try {
        const analytics = await getAnalyticsInstance();
        if (analytics) {
          const { logEvent } = await import("firebase/analytics");
          logEvent(analytics, "sign_up", { method: "password" });
        }
      } catch (err) {
        console.warn("Failed to log analytics event:", err);
      }

      // TEMPORARY: Go directly to search instead of verification page
      navigate("/search", { replace: true });
    } catch (err) {
      if (err?.code === "auth/email-already-in-use") {
        try {
          const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
          // TEMPORARY: Skip verification check, go directly to search
          navigate("/search", { replace: true });
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
        <div className="auth-field">
          <label className="auth-label">Full name</label>
          <input
            className="auth-input"
            type="text"
            placeholder="Jane Doe"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">Laurier Email</label>
          <input
            className="auth-input"
            type="email"
            inputMode="email"
            placeholder={`you${ALLOWED_DOMAIN}`}
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
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <button className="auth-btn" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Sign Up"}
        </button>
      </form>
    </AuthLayout>
  );
}
