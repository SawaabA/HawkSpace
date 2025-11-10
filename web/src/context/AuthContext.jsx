/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase";

export const ALLOWED_DOMAIN = "@mylaurier.ca";
const DEFAULT_ROLE = "user";
const ADMIN_ROLE = "admin";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

async function ensureUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const baseProfile = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || user.email || "",
    role: DEFAULT_ROLE,
  };

  if (!snap.exists()) {
    await setDoc(ref, {
      ...baseProfile,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
    return baseProfile;
  }

  const data = snap.data();
  await setDoc(
    ref,
    {
      email: baseProfile.email,
      displayName: baseProfile.displayName,
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ...baseProfile,
    ...data,
    role: data.role || DEFAULT_ROLE,
    displayName: baseProfile.displayName || data.displayName || "",
  };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, profile: null, claims: null, loading: true });

  useEffect(() => {
    console.log("AuthProvider: Setting up auth listener");
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthProvider: Auth state changed", firebaseUser ? "User logged in" : "No user");
      if (!firebaseUser) {
        setState({ user: null, profile: null, claims: null, loading: false });
        return;
      }
      try {
        const profile = await ensureUserProfile(firebaseUser);
        let claims = null;
        try {
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          claims = tokenResult.claims || null;
        } catch (tokenErr) {
          console.warn("Failed to load custom claims", tokenErr);
        }
        setState({ user: firebaseUser, profile, claims, loading: false });
      } catch (err) {
        console.error("Failed to sync user profile", err);
        setState({ user: firebaseUser, profile: null, claims: null, loading: false });
      }
    }, (error) => {
      console.error("AuthProvider: Auth listener error", error);
      setState({ user: null, profile: null, claims: null, loading: false });
    });
    return () => unsub();
  }, []);

  const login = useCallback(async (email, password, { remember = true } = {}) => {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized.endsWith(ALLOWED_DOMAIN)) {
      throw new Error(`Please sign in with your ${ALLOWED_DOMAIN} email.`);
    }
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, normalized, password);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return null;
    const profile = await ensureUserProfile(auth.currentUser);
    setState((prev) => ({ ...prev, profile }));
    return profile;
  }, []);

  const role = state.profile?.role || state.claims?.role || DEFAULT_ROLE;
  const claimsLoaded = state.user ? state.claims !== null || !state.loading : true;

  const value = useMemo(
    () => ({
      user: state.user,
      profile: state.profile,
      role,
      isAdmin: role === ADMIN_ROLE,
      loading: state.loading,
      claimsLoaded,
      login,
      logout,
      refreshProfile,
    }),
    [state, role, claimsLoaded, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
