import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { getAnalyticsInstance } from "../analytics";
import AuthLayout from "../components/AuthLayout";
import "../styles/Auth.css";

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
      if (!eLower.endsWith("@mylaurier.ca")) {
        throw new Error("Please use your @mylaurier.ca email to sign up.");
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

      const analytics = await getAnalyticsInstance();
      if (analytics) logEvent(analytics, "sign_up", { method: "password" });

      navigate("/login");
    } catch (err) {
      setError(err.message || "Failed to create account");
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
