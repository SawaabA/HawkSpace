import React, { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isPressed, setIsPressed] = useState(false); // NEW: track button press

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Username:", username);
    console.log("Password:", password);
    console.log("Remember me:", remember);
    // Add login logic here (e.g., API call)
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>
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
              backgroundColor: isPressed ? "#cccccc" : "white", // darken when pressed
            }}
            onMouseDown={() => setIsPressed(true)}  // mouse click start
            onMouseUp={() => setIsPressed(false)}   // mouse click release
            onMouseLeave={() => setIsPressed(false)} // in case cursor leaves button
          >
            Login
          </button>
        </form>
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
};
