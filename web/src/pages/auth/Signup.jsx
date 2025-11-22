import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
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
      if (displayName) await updateProfile(cred.user, { displayName });
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName || cred.user.displayName || "",
        createdAt: serverTimestamp(),
      });

      const analytics = await getAnalyticsInstance();
      if (analytics) {
        const { logEvent } = await import("firebase/analytics");
        logEvent(analytics, "sign_up", { method: "password" });
      }

      navigate("/search", { replace: true });
    } catch (err) {
      if (err?.code === "auth/email-already-in-use") {
        try {
          await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
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
