import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";

export function useRooms({ activeOnly = true } = {}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const constraints = [orderBy("displayName")];
    if (activeOnly) constraints.unshift(where("active", "==", true));
    const q = query(collection(db, "rooms"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setRooms(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load rooms", err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [activeOnly]);

  return { rooms, loading, error };
}
