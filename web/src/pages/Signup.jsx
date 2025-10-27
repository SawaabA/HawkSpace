import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import Loading from "../components/Loading";
import { logEvent } from "firebase/analytics";
import { getAnalyticsInstance } from "../analytics";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      const userRef = doc(db, "users", cred.user.uid);
      await setDoc(userRef, {
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
    <div style={styles.container}>
      {loading && <Loading message="Creating your account..." />}
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={styles.input}
            placeholder="Optional"
          />
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>Sign up</button>
        </form>
        <div style={{ marginTop: 12, fontSize: 14 }}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#ffffff",
  },
  card: {
    backgroundColor: "#d9d9d9",
    padding: "40px",
    borderRadius: "20px",
    width: "340px",
    textAlign: "center",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontWeight: "600",
    textAlign: "left",
    marginBottom: "5px",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    marginBottom: "15px",
    fontSize: "14px",
    backgroundColor: "#f5f5f5",
    borderBottom: "2px solid black",
  },
  button: {
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.1s",
    backgroundColor: "white",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "8px 10px",
    marginBottom: 12,
    fontSize: 14,
    textAlign: "left",
  },
};
