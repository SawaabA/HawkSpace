import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";

const serialize = (input) => JSON.stringify(input ?? {});

export function useBookingRequests(filters = {}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const memoKey = useMemo(() => serialize(filters), [filters]);

  useEffect(() => {
    const parsed = JSON.parse(memoKey);
    const constraints = [];

    if (parsed.requestedBy) constraints.push(where("requestedBy.uid", "==", parsed.requestedBy));
    if (parsed.roomId) constraints.push(where("roomId", "==", parsed.roomId));
    if (parsed.date) constraints.push(where("date", "==", parsed.date));
    if (parsed.status) {
      if (Array.isArray(parsed.status)) {
        const statuses = parsed.status.filter(Boolean);
        if (statuses.length === 1) constraints.push(where("status", "==", statuses[0]));
        else if (statuses.length > 1) constraints.push(where("status", "in", statuses.slice(0, 10)));
      } else {
        constraints.push(where("status", "==", parsed.status));
      }
    }

    constraints.push(orderBy("date", "asc"));
    constraints.push(orderBy("startSlot", "asc"));
    if (parsed.limit) constraints.push(limit(parsed.limit));

    const q = query(collection(db, "bookingRequests"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setRequests(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load booking requests", err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [memoKey]);

  return { requests, loading, error };
}
