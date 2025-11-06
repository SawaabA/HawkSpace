import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ROOMS } from "../data/rooms";
import { useBookings } from "../context/BookingContext";
import { timeOverlaps } from "../utils/overlap";

export default function BookRoom() {
  const { roomId } = useParams();
  const room = useMemo(() => ROOMS.find(r => r.id === roomId), [roomId]);
  const { bookings, addBooking } = useBookings();
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (!room) return <div style={{ padding: "2rem" }}>Room not found.</div>;

  const todaysBookings = bookings.filter(b => b.roomId === room.id && b.date === date);

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!date || !start || !end) {
      setError("Please choose date, start and end time.");
      return;
    }
    if (!(end > start)) {
      setError("End time must be after start time.");
      return;
    }

    // overlap?
    const clash = todaysBookings.some(b => timeOverlaps(start, end, b.startTime, b.endTime));
    if (clash) {
      setError("That time overlaps an existing booking for this room.");
      return;
    }

    const id = `${room.id}-${date}-${start}-${end}-${Math.random().toString(36).slice(2,8)}`;
    addBooking({
      id,
      uid: "demo-user",
      roomId: room.id,
      roomName: `${room.building} – ${room.name}`,
      date,
      startTime: start,
      endTime: end,
      notes,
      createdAt: new Date().toISOString(),
    });
    navigate("/my-bookings");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, Arial", maxWidth: 680 }}>
      <h1>Book {room.name} — {room.building}</h1>
      <div style={{ color: "#6b7280", marginBottom: "1rem" }}>
        Capacity {room.capacity} · Equipment: {room.equipment.join(", ")} · (demo: rooms are 24/7)
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
        <label>
          Date
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <div />
        <label>
          Start time
          <input type="time" value={start} onChange={e => setStart(e.target.value)} />
        </label>
        <label>
          End time
          <input type="time" value={end} onChange={e => setEnd(e.target.value)} />
        </label>

        <label style={{ gridColumn: "1 / -1" }}>
          Notes (optional)
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: "100%" }} />
        </label>

        {error && <div style={{ gridColumn: "1 / -1", color: "#b91c1c" }}>{error}</div>}

        <button type="submit" style={{ gridColumn: "1 / -1", background: "#111827", color: "#fff", padding: ".7rem 1rem", border: "none", borderRadius: 8 }}>
          Confirm booking
        </button>
      </form>

      <h3 style={{ marginTop: "2rem" }}>Existing bookings on {date || "(pick a date)"}:</h3>
      {date && todaysBookings.length === 0 && <div>None yet.</div>}
      {date && todaysBookings.length > 0 && (
        <ul>
          {todaysBookings.map(b => (
            <li key={b.id}>{b.startTime}–{b.endTime} · {b.notes || "No notes"}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
