import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";

export function useRoomCalendar(roomId, date) {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId || !date) {
      setCalendar(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, "rooms", roomId, "days", date);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setCalendar({ id: snap.id, ...snap.data() });
        } else {
          setCalendar({ roomId, date, slots: {}, pendingRequestIds: [] });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load calendar", err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [roomId, date]);

  return { calendar, loading, error };
}
