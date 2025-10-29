// src/pages/RequestBooking.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { addDoc, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

function overlaps(aStart, aEnd, bStart, bEnd) {
  // times are "HH:MM" 24h, so string compare works
  return aStart < bEnd && bStart < aEnd;
}

export default function RequestBooking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const user = auth.currentUser || null;

  const [form, setForm] = useState({
    roomId: "",
    roomName: "",
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
    name: "",
    email: "",
    club: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState("");

  // Prefill from query params and current user
  useEffect(() => {
    const prefilled = {
      roomId: params.get("roomId") || "",
      roomName: params.get("roomName") || "",
      date: params.get("date") || "",
      startTime: params.get("start") || "",
      endTime: params.get("end") || "",
    };
    setForm((f) => ({
      ...f,
      ...prefilled,
      name: user?.displayName || f.name,
      email: user?.email || f.email,
    }));
    // If not signed in, send to login then back here
    if (!user) {
      navigate("/login", { replace: true, state: { from: location } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const validTimes = useMemo(
    () => !!form.startTime && !!form.endTime && form.endTime > form.startTime,
    [form.startTime, form.endTime]
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // required fields
    const required = ["roomId", "roomName", "date", "startTime", "endTime", "email"];
    for (const k of required) {
      if (!form[k]) {
        alert("Please fill all required fields."); 
        return;
      }
    }
    if (!validTimes) {
      alert("End time must be later than start time.");
      return;
    }

    setSubmitting(true);
    try {
      // 1) conflict check for same room + date
      const qConflicts = query(
        collection(db, "bookings"),
        where("roomId", "==", form.roomId),
        where("date", "==", form.date)
      );
      const snap = await getDocs(qConflicts);
      const conflicts = snap.docs
        .map((d) => d.data())
        .some((b) => overlaps(form.startTime, form.endTime, b.startTime, b.endTime));

      if (conflicts) {
        alert("That room is already booked in this time window.");
        return;
      }

      // 2) create booking
      const docRef = await addDoc(collection(db, "bookings"), {
        uid: user.uid,
        roomId: form.roomId,
        roomName: form.roomName,
        date: form.date,          // "YYYY-MM-DD"
        startTime: form.startTime, // "HH:MM"
        endTime: form.endTime,
        notes: form.notes || "",
        createdAt: serverTimestamp(),
      });
      setCreatedId(docRef.id);
    } catch (err) {
      console.error(err);
      alert("Failed to submit booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null; // redirected to login

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, Arial" }}>
      <h1>Request Booking</h1>

      {!createdId ? (
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: "0.9rem", maxWidth: 420 }}
        >
          {/* read-only user info pulled from auth */}
          <input name="name" value={form.name} onChange={onChange} placeholder="Your name"
                 disabled style={{ background: "#f3f4f6" }} />
          <input name="email" value={form.email} onChange={onChange} placeholder="Your email"
                 disabled style={{ background: "#f3f4f6" }} />

          <input name="club" value={form.club} onChange={onChange} placeholder="Club (optional)" />

          {/* room & time */}
          <input name="roomName" value={form.roomName} onChange={onChange}
                 placeholder="Room name" disabled={!!form.roomName}
                 style={form.roomName ? { background: "#f3f4f6" } : undefined}/>
          <input name="roomId" value={form.roomId} onChange={onChange}
                 placeholder="Room ID" disabled={!!form.roomId}
                 style={form.roomId ? { background: "#f3f4f6" } : undefined}/>

          <input type="date" name="date" value={form.date} onChange={onChange} />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div>
              <label style={{ fontSize: 12 }}>Start</label>
              <input type="time" name="startTime" value={form.startTime} onChange={onChange} />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>End</label>
              <input type="time" name="endTime" value={form.endTime} onChange={onChange} />
            </div>
          </div>
          {!validTimes && form.startTime && form.endTime && (
            <div style={{ color: "#b91c1c", fontSize: 13 }}>End time must be after start time.</div>
          )}

          <textarea name="notes" value={form.notes} onChange={onChange} placeholder="Notes (optional)" />

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: "#3b82f6",
              color: "#fff",
              padding: "0.6rem",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {submitting ? "Submitting…" : "Submit Booking"}
          </button>
        </form>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          <h3>✅ Booking submitted!</h3>
          <p>Your request ID: <code>{createdId}</code></p>
          <button
            onClick={() => navigate("/")}
            style={{ marginTop: 8, padding: ".5rem .9rem", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer" }}
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
}
