import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = "hawkspace_user";
const ALLOWED_DOMAIN = "@mylaurier.ca"; // <- domain guard

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  function login(email) {
    if (!email || !email.includes("@")) throw new Error("Enter a valid email.");
    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN))
      throw new Error(`Please use your ${ALLOWED_DOMAIN} email.`);
    setUser({ email });
  }

  function logout() {
    setUser(null);
  }

  const value = useMemo(() => ({ user, isAuthed: !!user, login, logout, ALLOWED_DOMAIN }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
