// src/components/UnauthRoute.jsx
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { Navigate, useLocation } from "react-router-dom";

export default function UnauthRoute({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const loc = useLocation();

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); }), []);

  if (!ready) return null;
  if (user) return <Navigate to="/search" replace state={{ from: loc }} />;
  return children;
}
