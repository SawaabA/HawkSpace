import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import Loading from "../components/Loading";
import { logEvent } from "firebase/analytics";
import { getAnalyticsInstance } from "../analytics";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Using username as email (per given UI). Adjust if you change to email field
      const persistence = remember ? "local" : "session";
      window.localStorage.setItem("auth_persistence", persistence);
      await signInWithEmailAndPassword(auth, username, password);
      const analytics = await getAnalyticsInstance();
      if (analytics) logEvent(analytics, "login", { method: "password" });
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {loading && <Loading message="Signing you in..." />}
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
          <div style={styles.rememberRow}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ marginRight: "6px" }}
            />
            <span style={styles.rememberText}>Remember me</span>
          </div>
          <button
            type="submit"
            style={{
              ...styles.button,
              backgroundColor: isPressed ? "#cccccc" : "white",
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
          >
            Login
          </button>
        </form>
        <div style={{ marginTop: 12, fontSize: 14 }}>
          No account? <Link to="/signup">Create one</Link>
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
    width: "320px",
    textAlign: "center",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "25px",
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
  rememberRow: {
    display: "flex",
    alignItems: "center",
    textAlign: "left",
    marginBottom: "20px",
  },
  rememberText: {
    fontSize: "14px",
  },
  button: {
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.1s",
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


