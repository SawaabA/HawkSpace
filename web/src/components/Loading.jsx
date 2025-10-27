import React from "react";

export default function Loading({ message = "Loading..." }) {
  return (
    <div style={styles.container} role="status" aria-live="polite">
      <div style={styles.card}>
        <div style={styles.spinner} />
        <div style={styles.text}>{message}</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    zIndex: 1000,
  },
  card: {
    backgroundColor: "#d9d9d9",
    padding: "40px",
    borderRadius: "20px",
    width: "280px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #ffffff",
    borderTopColor: "#111827",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  text: {
    fontSize: "16px",
    fontWeight: "bold",
  },
};

// Inject a keyframes style tag once
if (typeof document !== "undefined" && !document.getElementById("loading-spin-style")) {
  const style = document.createElement("style");
  style.id = "loading-spin-style";
  style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

